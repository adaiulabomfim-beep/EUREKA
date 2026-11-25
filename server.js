import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega .env / .env.local caso existam no ambiente local, sem sobrescrever variáveis já definidas
function loadLocalEnvFiles() {
  for (const filename of ['.env', '.env.local']) {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) continue;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIndex = line.indexOf('=');
        if (eqIndex <= 0) continue;
        const key = line.slice(0, eqIndex).trim();
        let value = line.slice(eqIndex + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!(key in process.env)) {
          process.env[key] = value;
        }
      }
    } catch {
      // Ignora erro de leitura de arquivo .env local
    }
  }
}

loadLocalEnvFiles();

function resolveThinkingLevel(rawLevel) {
  const normalized = String(rawLevel || '').trim().toUpperCase();
  if (
    normalized === ThinkingLevel.LOW ||
    normalized === ThinkingLevel.MEDIUM ||
    normalized === ThinkingLevel.HIGH
  ) {
    return normalized;
  }
  return ThinkingLevel.LOW;
}

function parsePositiveInt(raw, fallback) {
  const num = Number(raw);
  return Number.isInteger(num) && num > 0 ? num : fallback;
}

const GEMINI_MODEL = (process.env.GEMINI_MODEL || '').trim() || 'gemini-3.5-flash-lite';
const GEMINI_THINKING_LEVEL = resolveThinkingLevel(process.env.GEMINI_THINKING_LEVEL);

// Modelos de fallback caso o principal esteja indisponível (503/504)
const GEMINI_FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
].filter(m => m !== GEMINI_MODEL);

// Modelos que NÃO suportam thinkingConfig
const MODELS_WITHOUT_THINKING = new Set([
  'gemini-3.5-flash-lite',
]);
const MAX_BODY_BYTES = 50 * 1024 * 1024; // 50 MB para uploads de imagem em Base64
const MAX_CONTEXT_CHARS = 4000;
const MAX_HISTORY_MESSAGES = 12; // Até 6 turnos completos
const MAX_CONCURRENT_GEMINI = parsePositiveInt(process.env.GEMINI_MAX_CONCURRENT, 5);
const MAX_QUEUE_SIZE = parsePositiveInt(process.env.GEMINI_MAX_QUEUE_SIZE, 50);
const SESSION_RATE_WINDOW_MS = 60 * 1000;
const SESSION_RATE_MAX = parsePositiveInt(process.env.GEMINI_SESSION_RPM, 60);
const SESSION_MIN_INTERVAL_MS = parsePositiveInt(process.env.GEMINI_SESSION_MIN_INTERVAL_MS, 500);
const IP_RATE_WINDOW_MS = 60 * 1000;
const IP_RATE_MAX = parsePositiveInt(process.env.GEMINI_IP_RPM, 120);
const CACHE_MAX_ENTRIES = parsePositiveInt(process.env.GEMINI_CACHE_MAX_ENTRIES, 200);
const CACHE_TTL_MS = parsePositiveInt(process.env.GEMINI_CACHE_TTL_MS, 60 * 60 * 1000);
const DAILY_QUOTA_FALLBACK_COOLDOWN_MS = parsePositiveInt(
  process.env.GEMINI_DAILY_COOLDOWN_MS,
  15 * 60 * 1000
);
const MAX_RPM_429_RETRIES = 2;
const GEMINI_REQUEST_TIMEOUT_MS = parsePositiveInt(process.env.GEMINI_REQUEST_TIMEOUT_MS, 25000);

const SYSTEM_INSTRUCTION =
  'Você é o Tutor de Mecânica dos Fluidos (Hidrostática e Empuxo) do EUREKA. Explique como um professor universitário didático, claro e direto. Quando houver CONTEXTO DA SIMULAÇÃO ATIVA, baseie toda explicação exatamente nesses valores calculados pelo laboratório. PROIBIDO usar LaTeX ($...$, \\text{}, ^); escreva unidades em texto limpo (ex.: kg/m³, N, m², Pa).';

let cachedApiKey = '';
let cachedClient = null;

// IMPORTANTE (Vercel Serverless vs Servidor Node contínuo):
// Os controles abaixo (fila de execução, rate limiter, deduplicação em voo, cache conceitual,
// circuit breaker e métricas agregadas) residem em memória do processo.
// Em execução contínua (`node server.js`), aplicam-se globalmente ao processo único.
// Na Vercel Serverless, funcionam POR INSTÂNCIA ativa — não representam limitação global entre instâncias.

const sessionBuckets = new Map();
const ipBuckets = new Map();
const conceptualCache = new Map();
const inFlightRequests = new Map();
const waitQueue = [];
let activeGeminiCount = 0;

const circuitBreakerState = {
  blockedUntilMs: 0,
  retryDelayKnown: false,
  apiKeyFingerprint: '',
};

const metricsState = {
  startedAtIso: new Date().toISOString(),
  requestsTotal: 0,
  requestsServed: 0,
  requestsServedFromCache: 0,
  requestsServedByGemini: 0,
  requestsDeduplicated: 0,
  requestsRejected: 0,
  rejections: {
    rateLimit: 0,
    queueFull: 0,
    dailyQuotaCircuitBreaker: 0,
    invalidRequest: 0,
    otherErrors: 0,
  },
  errors429Total: 0,
  errors429Rpm: 0,
  errors429Daily: 0,
  latencyTotalMs: 0,
  latencyCount: 0,
  tokens: {
    promptTokens: 0,
    candidatesTokens: 0,
    thoughtsTokens: 0,
    totalTokens: 0,
    responsesWithUsage: 0,
  },
  cache: {
    hits: 0,
    misses: 0,
  },
};

function fingerprintApiKey(apiKey) {
  return apiKey ? crypto.createHash('sha256').update(apiKey).digest('hex').slice(0, 12) : '';
}

function getGeminiClient() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return null;
  }
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedApiKey = apiKey;
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    const fp = fingerprintApiKey(apiKey);
    if (circuitBreakerState.apiKeyFingerprint && circuitBreakerState.apiKeyFingerprint !== fp) {
      circuitBreakerState.blockedUntilMs = 0;
      circuitBreakerState.retryDelayKnown = false;
    }
    circuitBreakerState.apiKeyFingerprint = fp;
  }
  return cachedClient;
}

if (!(process.env.GEMINI_API_KEY || '').trim()) {
  console.warn(
    'AVISO: GEMINI_API_KEY não configurada no ambiente do servidor. A rota /api/chat retornará erro até que a variável seja definida.'
  );
}

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(body);
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Eureka-Session, X-Metrics-Token, Authorization');
}

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === 'string') {
    try {
      return Promise.resolve(req.body.trim() ? JSON.parse(req.body) : {});
    } catch {
      const err = new Error('INVALID_JSON');
      err.statusCode = 400;
      return Promise.reject(err);
    }
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    req.on('data', (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        const err = new Error('PAYLOAD_TOO_LARGE');
        err.statusCode = 413;
        reject(err);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        if (!raw) {
          resolve({});
          return;
        }
        resolve(JSON.parse(raw));
      } catch {
        const err = new Error('INVALID_JSON');
        err.statusCode = 400;
        reject(err);
      }
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

function sanitizeContents(rawContents) {
  if (!Array.isArray(rawContents) || rawContents.length === 0) {
    return [];
  }

  const normalized = [];
  for (const item of rawContents) {
    if (!item || typeof item !== 'object') continue;
    const role = item.role === 'model' ? 'model' : 'user';
    const rawParts = Array.isArray(item.parts) ? item.parts : [];
    const parts = [];

    for (const part of rawParts) {
      if (!part || typeof part !== 'object') continue;
      if (typeof part.text === 'string' && part.text.trim().length > 0) {
        parts.push({ text: part.text });
      } else if (
        part.inlineData &&
        typeof part.inlineData === 'object' &&
        typeof part.inlineData.data === 'string' &&
        part.inlineData.data.length > 0
      ) {
        const mimeType =
          typeof part.inlineData.mimeType === 'string' && part.inlineData.mimeType.startsWith('image/')
            ? part.inlineData.mimeType
            : 'image/png';
        parts.push({
          inlineData: {
            mimeType,
            data: part.inlineData.data,
          },
        });
      }
    }

    if (parts.length > 0) {
      normalized.push({ role, parts });
    }
  }

  if (normalized.length === 0) {
    return [];
  }

  // Reduz histórico mantendo apenas os turnos mais recentes (MAX_HISTORY_MESSAGES)
  const trimmedWindow = normalized.slice(-MAX_HISTORY_MESSAGES);

  // Preserva imagem da mensagem atual (se houver) e a imagem mais recente anterior no histórico
  // para não perder o contexto visual em perguntas de acompanhamento, omitindo imagens ainda mais antigas.
  const lastIndex = trimmedWindow.length - 1;
  let keptPriorImage = false;
  const compacted = trimmedWindow.map((item) => ({
    role: item.role,
    parts: [...item.parts],
  }));

  for (let i = lastIndex; i >= 0; i -= 1) {
    const item = compacted[i];
    const hasImg = item.parts.some((p) => Boolean(p.inlineData));
    if (!hasImg) continue;

    if (i === lastIndex) {
      continue; // Sempre mantém imagem na mensagem atual
    }
    if (!keptPriorImage) {
      keptPriorImage = true; // Preserva a imagem anterior mais recente necessária ao diálogo
      continue;
    }

    // Remove imagens redundantes mais antigas, preservando texto
    const textOnlyParts = item.parts.filter((p) => !p.inlineData);
    item.parts =
      textOnlyParts.length > 0
        ? textOnlyParts
        : [{ text: '[Imagem anterior omitida para economia de tokens]' }];
  }

  return compacted;
}

function sanitizeSimulationContext(rawContext) {
  if (typeof rawContext !== 'string') return '';
  const compacted = rawContext
    .replace(/\s+/g, ' ')
    .replace(/^CONTEXTO DO LABORATÓRIO DE /i, 'Lab ')
    .replace(/^LABORATÓRIO DE HIDROSTÁTICA:\s*/i, 'Lab Hidrostática: ')
    .trim();
  if (!compacted) return '';
  return compacted.slice(0, MAX_CONTEXT_CHARS);
}

function normalizeConceptualText(rawText) {
  return String(rawText || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[?!.,;:()[\]"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isStandaloneConceptualQuestion(contents) {
  if (!Array.isArray(contents) || contents.length !== 1) return false;
  const onlyTurn = contents[0];
  if (!onlyTurn || onlyTurn.role !== 'user' || !Array.isArray(onlyTurn.parts)) return false;
  if (onlyTurn.parts.some((part) => Boolean(part?.inlineData))) return false;

  const textParts = onlyTurn.parts
    .filter((part) => typeof part?.text === 'string')
    .map((part) => part.text);
  const fullText = textParts.join(' ').trim();
  if (!fullText || fullText.length < 8 || fullText.length > 180) return false;
  if (/\d/.test(fullText)) return false;

  const normalized = normalizeConceptualText(fullText);

  const blockedContextTerms = [
    'simulac',
    'ensaio',
    'experiment',
    'tela',
    'aqui',
    'atual',
    'nesse',
    'nessa',
    'desse',
    'dessa',
    'este ',
    'esta ',
    'esse ',
    'essa ',
    'resultad',
    'calcul',
    'valor',
    'parametr',
    'dobrar',
    'aumentar',
    'diminuir',
    'alterar',
    'mudar',
    'cabo',
    'boia',
    'barragem',
    'comporta',
    'tanque',
    'bloco',
    'esfera',
    'cilindro',
    'lama',
    'mercurio',
    'imagem',
    'figura',
    'grafico',
    'memorial',
    'deu ',
    'por que deu',
  ];

  if (blockedContextTerms.some((term) => normalized.includes(term))) {
    return false;
  }

  const allowedConceptualPatterns = [
    /^o que (e|eh|sao|significa) /,
    /^qual (a |e a )?diferenca entre /,
    /^defina /,
    /^explique o conceito /,
    /^conceito de /,
    /^(o que diz|explique) (o )?(principio de arquimedes|principio de pascal|teorema de stevin|lei de stevin)/,
    /^como funciona (o empuxo|a pressao hidrostatica|o principio de arquimedes)/,
  ];

  return allowedConceptualPatterns.some((pattern) => pattern.test(normalized));
}

function buildSystemInstruction(simulationContext) {
  if (!simulationContext) {
    return SYSTEM_INSTRUCTION;
  }
  return `${SYSTEM_INSTRUCTION}\n\nCONTEXTO DA SIMULAÇÃO ATIVA (use apenas estes dados como referência do estado atual):\n${simulationContext}`;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return String(req.socket?.remoteAddress || 'unknown').trim();
}

function getClientSessionHint(req) {
  const raw = req.headers['x-eureka-session'];
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  return /^[A-Za-z0-9_-]{8,64}$/.test(trimmed) ? trimmed : '';
}

function pruneBucketMap(map, maxAgeMs, now) {
  if (map.size < 500) return;
  for (const [key, bucket] of map.entries()) {
    if (!bucket || now - (bucket.lastAt || 0) > maxAgeMs) {
      map.delete(key);
    }
  }
}

function checkRateLimit(req) {
  const now = Date.now();
  pruneBucketMap(ipBuckets, IP_RATE_WINDOW_MS * 2, now);
  pruneBucketMap(sessionBuckets, SESSION_RATE_WINDOW_MS * 2, now);

  const ip = getClientIp(req);
  const sessionHint = getClientSessionHint(req);

  // 1. Proteção complementar por IP (independente do cabeçalho auxiliar X-Eureka-Session)
  const ipEntry = ipBuckets.get(ip) || { timestamps: [], lastAt: 0 };
  ipEntry.timestamps = ipEntry.timestamps.filter((ts) => now - ts < IP_RATE_WINDOW_MS);

  if (ipEntry.timestamps.length >= IP_RATE_MAX) {
    const oldest = ipEntry.timestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((IP_RATE_WINDOW_MS - (now - oldest)) / 1000));
    ipBuckets.set(ip, ipEntry);
    return {
      allowed: false,
      retryAfterSeconds,
      reason: 'IP_RATE_LIMIT',
      message: `Muitas requisições originadas deste endereço em curto intervalo. Aguarde ${retryAfterSeconds}s e tente novamente.`,
    };
  }

  // 2. Controle auxiliar por sessão (ou fallback estrito por IP se sessão ausente)
  const userKey = sessionHint ? `${ip}::${sessionHint}` : `${ip}::no-session`;
  const userEntry = sessionBuckets.get(userKey) || { timestamps: [], lastAt: 0 };
  userEntry.timestamps = userEntry.timestamps.filter((ts) => now - ts < SESSION_RATE_WINDOW_MS);

  if (userEntry.lastAt && now - userEntry.lastAt < SESSION_MIN_INTERVAL_MS) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((SESSION_MIN_INTERVAL_MS - (now - userEntry.lastAt)) / 1000)
    );
    return {
      allowed: false,
      retryAfterSeconds,
      reason: 'COOLDOWN_ACTIVE',
      message: `Aguarde ${retryAfterSeconds}s antes de enviar uma nova pergunta ao Tutor Inteligente.`,
    };
  }

  if (userEntry.timestamps.length >= SESSION_RATE_MAX) {
    const oldest = userEntry.timestamps[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((SESSION_RATE_WINDOW_MS - (now - oldest)) / 1000)
    );
    return {
      allowed: false,
      retryAfterSeconds,
      reason: 'SESSION_RATE_LIMIT',
      message: `Você atingiu o limite temporário de perguntas por minuto (${SESSION_RATE_MAX}/min) para preservar a cota gratuita. Aguarde ${retryAfterSeconds}s.`,
    };
  }

  ipEntry.timestamps.push(now);
  ipEntry.lastAt = now;
  ipBuckets.set(ip, ipEntry);

  userEntry.timestamps.push(now);
  userEntry.lastAt = now;
  sessionBuckets.set(userKey, userEntry);

  return { allowed: true };
}

function getCachedConceptualAnswer(questionText) {
  const key = `${GEMINI_MODEL}::${GEMINI_THINKING_LEVEL}::${normalizeConceptualText(questionText)}`;
  const entry = conceptualCache.get(key);
  if (!entry) {
    metricsState.cache.misses += 1;
    return { hit: false, key };
  }
  if (Date.now() > entry.expiresAt) {
    conceptualCache.delete(key);
    metricsState.cache.misses += 1;
    return { hit: false, key };
  }
  // Atualiza posição LRU
  conceptualCache.delete(key);
  conceptualCache.set(key, entry);
  metricsState.cache.hits += 1;
  return { hit: true, key, value: entry };
}

function setCachedConceptualAnswer(key, payload) {
  if (conceptualCache.has(key)) {
    conceptualCache.delete(key);
  }
  while (conceptualCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = conceptualCache.keys().next().value;
    if (!oldestKey) break;
    conceptualCache.delete(oldestKey);
  }
  conceptualCache.set(key, {
    ...payload,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function parseRetryDelaySeconds(error) {
  const raw = String(error?.message || '');
  const detailsStr = error?.details ? JSON.stringify(error.details) : '';
  const combined = `${raw}\n${detailsStr}`;

  const jsonRetryMatch = combined.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i);
  if (jsonRetryMatch) {
    const secs = Math.ceil(Number(jsonRetryMatch[1]));
    if (Number.isFinite(secs) && secs > 0) {
      return { seconds: secs, known: true };
    }
  }

  const textRetryMatch = combined.match(
    /Please retry in\s+(?:(\d+)h)?(?:(\d+)m)?(\d+(?:\.\d+)?)s/i
  );
  if (textRetryMatch) {
    const hours = Number(textRetryMatch[1] || 0);
    const mins = Number(textRetryMatch[2] || 0);
    const secs = Number(textRetryMatch[3] || 0);
    const total = Math.ceil(hours * 3600 + mins * 60 + secs);
    if (Number.isFinite(total) && total > 0) {
      return { seconds: total, known: true };
    }
  }

  return { seconds: null, known: false };
}

function isDaily429QuotaError(rawMessage, retryDelayInfo) {
  const upperMsg = String(rawMessage || '').toUpperCase();
  if (
    upperMsg.includes('FREETIER') ||
    upperMsg.includes('FREE_TIER') ||
    upperMsg.includes('PER DAY') ||
    upperMsg.includes('GENERATEREQUESTSPERDAY')
  ) {
    return true;
  }
  if (retryDelayInfo?.known && retryDelayInfo.seconds > 120) {
    return true;
  }
  return false;
}

function sanitizeErrorMessage(raw) {
  return String(raw || '')
    .replace(/([?&]key=)[^&\s"']+/gi, '$1[REDACTED]')
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, '[REDACTED]');
}

function classifyGeminiError(error) {
  if (error?.code === 'CIRCUIT_BREAKER_OPEN') {
    const remainingSec = Math.max(
      1,
      Math.ceil((circuitBreakerState.blockedUntilMs - Date.now()) / 1000)
    );
    return {
      statusCode: 429,
      geminiHttpStatus: 429,
      rawMessage: 'Circuit breaker ativo após esgotamento de cota diária gratuita.',
      code: 'QUOTA_EXCEEDED',
      isDailyFreeTier: true,
      retryAfterSeconds: circuitBreakerState.retryDelayKnown ? remainingSec : undefined,
      retryDelayKnown: circuitBreakerState.retryDelayKnown,
      message: circuitBreakerState.retryDelayKnown
        ? 'O Tutor Inteligente está temporariamente indisponível porque a cota diária gratuita da API Gemini foi atingida. As solicitações serão liberadas após a renovação da cota.'
        : 'O Tutor Inteligente está temporariamente indisponível porque a cota diária gratuita da API Gemini foi atingida (horário exato de renovação não informado pela API).',
    };
  }

  if (error?.code === 'QUEUE_FULL') {
    return {
      statusCode: 503,
      geminiHttpStatus: null,
      rawMessage: 'Fila de atendimento simultâneo cheia.',
      code: 'QUEUE_FULL',
      retryAfterSeconds: 5,
      message: 'Muitos estudantes estão consultando o Tutor simultaneamente no momento. Aguarde alguns segundos e tente novamente.',
    };
  }

  const status = Number(error?.status || error?.statusCode || error?.code || 0);
  const rawMessage = sanitizeErrorMessage(error?.message || '');
  const upperMsg = rawMessage.toUpperCase();
  const retryDelayInfo = parseRetryDelaySeconds(error);

  if (
    status === 401 ||
    status === 403 ||
    upperMsg.includes('API_KEY_INVALID') ||
    upperMsg.includes('API KEY NOT VALID') ||
    upperMsg.includes('PERMISSION_DENIED') ||
    upperMsg.includes('UNAUTHENTICATED')
  ) {
    return {
      statusCode: status === 403 ? 403 : 401,
      geminiHttpStatus: status || null,
      rawMessage,
      code: 'AUTH_ERROR',
      message:
        'Falha de autenticação com a API Gemini. Verifique se a chave GEMINI_API_KEY configurada no servidor é válida e possui permissão.',
    };
  }

  if (
    status === 404 ||
    upperMsg.includes('NOT_FOUND') ||
    (upperMsg.includes('MODEL') && (upperMsg.includes('NOT FOUND') || upperMsg.includes('NOT SUPPORTED')))
  ) {
    return {
      statusCode: 502,
      geminiHttpStatus: status || 404,
      rawMessage,
      code: 'MODEL_UNAVAILABLE',
      message: `O modelo Gemini (${GEMINI_MODEL}) não está disponível ou não é suportado pela chave configurada.`,
    };
  }

  if (
    status === 429 ||
    upperMsg.includes('RESOURCE_EXHAUSTED') ||
    upperMsg.includes('QUOTA') ||
    upperMsg.includes('RATE LIMIT')
  ) {
    const isDailyFreeTier = isDaily429QuotaError(rawMessage, retryDelayInfo);
    return {
      statusCode: 429,
      geminiHttpStatus: status || 429,
      rawMessage,
      code: 'QUOTA_EXCEEDED',
      isDailyFreeTier,
      retryAfterSeconds: retryDelayInfo.known ? retryDelayInfo.seconds : isDailyFreeTier ? undefined : 15,
      retryDelayKnown: retryDelayInfo.known,
      message: isDailyFreeTier
        ? retryDelayInfo.known
          ? 'O Tutor Inteligente está temporariamente indisponível porque a cota diária gratuita da API Gemini (plano gratuito) foi atingida. Tente novamente após a renovação diária.'
          : 'O Tutor Inteligente está temporariamente indisponível porque a cota diária gratuita da API Gemini foi atingida (horário exato de renovação não informado pela API).'
        : 'O Tutor atingiu temporariamente o limite de requisições por minuto da cota gratuita. Aguarde alguns instantes e tente novamente.',
    };
  }

  if (
    status === 400 ||
    upperMsg.includes('INVALID_ARGUMENT')
  ) {
    return {
      statusCode: 400,
      geminiHttpStatus: status || 400,
      rawMessage,
      code: 'INVALID_REQUEST',
      message: 'A solicitação enviada não pôde ser processada pela API Gemini. Verifique o texto ou imagem enviada.',
    };
  }

  const errName = String(error?.name || '').toUpperCase();
  const isTimeoutOrAbort = errName === 'TIMEOUTERROR' || errName === 'ABORTERROR';
  const rawStatus = Number(error?.status || error?.statusCode || (!isTimeoutOrAbort ? error?.code : 0) || 0);
  if (
    rawStatus === 502 ||
    rawStatus === 503 ||
    rawStatus === 504 ||
    isTimeoutOrAbort ||
    upperMsg.includes('FETCH FAILED') ||
    upperMsg.includes('ECONNREFUSED') ||
    upperMsg.includes('ENOTFOUND') ||
    upperMsg.includes('ETIMEDOUT') ||
    upperMsg.includes('TIMEOUT') ||
    upperMsg.includes('ABORTED') ||
    upperMsg.includes('NETWORK') ||
    upperMsg.includes('UNAVAILABLE')
  ) {
    return {
      statusCode: 503,
      geminiHttpStatus: isTimeoutOrAbort ? 504 : rawStatus || 503,
      rawMessage,
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'Falha de comunicação ou tempo limite excedido com os servidores do Google Gemini. Tente novamente em instantes.',
    };
  }

  return {
    statusCode: 500,
    geminiHttpStatus: status || null,
    rawMessage,
    code: 'INTERNAL_ERROR',
    message: 'Erro interno ao gerar resposta do Tutor Inteligente no servidor.',
  };
}

function extractGeminiResponseDetails(response) {
  const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
  const firstCandidate = candidates[0] || null;
  const content = firstCandidate?.content || null;
  const parts = Array.isArray(content?.parts) ? content.parts : [];
  const finishReason = firstCandidate?.finishReason || null;
  const blockReason = response?.promptFeedback?.blockReason || null;
  const usageMetadata = response?.usageMetadata || null;

  let text = typeof response?.text === 'string' ? response.text : '';
  if (!text.trim() && parts.length > 0) {
    text = parts
      .filter((part) => part && typeof part.text === 'string' && !part.thought)
      .map((part) => part.text)
      .join('');
  }

  return {
    text,
    candidatesCount: candidates.length,
    hasContent: Boolean(content),
    partsCount: parts.length,
    hasText: Boolean(text.trim()),
    finishReason,
    blockReason,
    usage: usageMetadata
      ? {
          promptTokens: Number(usageMetadata.promptTokenCount || 0),
          candidatesTokens: Number(usageMetadata.candidatesTokenCount || 0),
          thoughtsTokens: Number(usageMetadata.thoughtsTokenCount || 0),
          totalTokens: Number(usageMetadata.totalTokenCount || 0),
        }
      : null,
  };
}

function drainQueue() {
  while (activeGeminiCount < MAX_CONCURRENT_GEMINI && waitQueue.length > 0) {
    const job = waitQueue.shift();
    if (!job) break;
    activeGeminiCount += 1;
    Promise.resolve()
      .then(() => job.fn())
      .then(job.resolve, job.reject)
      .finally(() => {
        activeGeminiCount = Math.max(0, activeGeminiCount - 1);
        drainQueue();
      });
  }
}

function enqueueGeminiTask(fn) {
  if (activeGeminiCount < MAX_CONCURRENT_GEMINI && waitQueue.length === 0) {
    activeGeminiCount += 1;
    return Promise.resolve()
      .then(() => fn())
      .finally(() => {
        activeGeminiCount = Math.max(0, activeGeminiCount - 1);
        drainQueue();
      });
  }

  if (waitQueue.length >= MAX_QUEUE_SIZE) {
    const err = new Error('QUEUE_FULL');
    err.code = 'QUEUE_FULL';
    return Promise.reject(err);
  }

  return new Promise((resolve, reject) => {
    waitQueue.push({ fn, resolve, reject });
  });
}

async function callGeminiSerialized({ ai, systemInstruction, contents }) {
  if (circuitBreakerState.blockedUntilMs > Date.now()) {
    const err = new Error('CIRCUIT_BREAKER_OPEN');
    err.code = 'CIRCUIT_BREAKER_OPEN';
    throw err;
  }

  return enqueueGeminiTask(async () => {
    if (circuitBreakerState.blockedUntilMs > Date.now()) {
      const err = new Error('CIRCUIT_BREAKER_OPEN');
      err.code = 'CIRCUIT_BREAKER_OPEN';
      throw err;
    }

    let rpmRetries = 0;
    let transientRetries = 0;

    const modelsToTry = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS];
    let lastError = null;

    for (const currentModel of modelsToTry) {
      let rpmRetries = 0;
      let transientRetries = 0;

      const supportsThinking = !MODELS_WITHOUT_THINKING.has(currentModel);
      const modelConfig = {
        systemInstruction,
        abortSignal: AbortSignal.timeout(GEMINI_REQUEST_TIMEOUT_MS),
      };
      if (supportsThinking) {
        modelConfig.thinkingConfig = { thinkingLevel: GEMINI_THINKING_LEVEL };
      }

    while (true) {
      try {
        const result = await ai.models.generateContent({
          model: currentModel,
          config: modelConfig,
          contents,
        });
        if (currentModel !== GEMINI_MODEL) {
          console.info(`[API /api/chat] Fallback: respondeu via modelo ${currentModel} (principal ${GEMINI_MODEL} indisponível)`);
        }
        return result;
      } catch (attemptError) {
        const status = Number(attemptError?.status || attemptError?.statusCode || attemptError?.code || 0);
        const msg = String(attemptError?.message || '').toUpperCase();
        const is429 =
          status === 429 ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('QUOTA') ||
          msg.includes('RATE LIMIT');

        if (is429) {
          metricsState.errors429Total += 1;
          const retryDelayInfo = parseRetryDelaySeconds(attemptError);
          const isDaily = isDaily429QuotaError(attemptError?.message, retryDelayInfo);

          if (isDaily) {
            metricsState.errors429Daily += 1;
            const durationMs = retryDelayInfo.known
              ? Math.min(retryDelayInfo.seconds, 86400) * 1000
              : DAILY_QUOTA_FALLBACK_COOLDOWN_MS;
            circuitBreakerState.blockedUntilMs = Date.now() + durationMs;
            circuitBreakerState.retryDelayKnown = retryDelayInfo.known;
            console.warn('[API /api/chat] Cota diária esgotada — circuit breaker ativado:', {
              retryDelayKnown: retryDelayInfo.known,
              cooldownSeconds: Math.round(durationMs / 1000),
            });
            throw attemptError; // Não realiza retentativas em cota diária
          }

          metricsState.errors429Rpm += 1;
          if (rpmRetries >= MAX_RPM_429_RETRIES) {
            throw attemptError;
          }
          rpmRetries += 1;
          const waitMs =
            retryDelayInfo.known && retryDelayInfo.seconds <= 5
              ? Math.max(1000, retryDelayInfo.seconds * 1000)
              : 1500 * rpmRetries;
          console.warn(
            `[API /api/chat] HTTP 429 por minuto (RPM), espera progressiva ${waitMs}ms (tentativa ${rpmRetries}/${MAX_RPM_429_RETRIES})...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

        const isTransient5xx =
          status === 503 || status === 504 || msg.includes('UNAVAILABLE') || msg.includes('HIGH DEMAND');
        if (isTransient5xx && transientRetries < 2) {
          transientRetries += 1;
          const delayMs = 700 * transientRetries;
          console.warn(
            `[API /api/chat] Erro transitório (${status || 'UNAVAILABLE'}) em ${currentModel}, tentativa ${transientRetries}/2; aguardando ${delayMs}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // Se é erro transitório e há modelos de fallback, tenta o próximo
        if (isTransient5xx) {
          lastError = attemptError;
          console.warn(`[API /api/chat] Modelo ${currentModel} indisponível, tentando fallback...`);
          break; // sai do while, vai para o próximo modelo no for
        }

        throw attemptError;
      }
    }
    } // fim do for de modelos

    // Se nenhum modelo funcionou, lança o último erro
    if (lastError) throw lastError;
  });
}

export function getMetricsSnapshot() {
  const avgLatencyMs =
    metricsState.latencyCount > 0
      ? Math.round(metricsState.latencyTotalMs / metricsState.latencyCount)
      : 0;

  const circuitActive = circuitBreakerState.blockedUntilMs > Date.now();
  const isVercel = Boolean(process.env.VERCEL);

  return {
    scope: 'per-instance',
    runtime: isVercel ? 'vercel-serverless' : 'node-server',
    note: isVercel
      ? 'Na Vercel Serverless, fila, rate limiter, cache e circuit breaker operam em memória por instância ativa (não são globais entre instâncias).'
      : 'Em processo Node contínuo, os controles operam na instância única em execução.',
    startedAtIso: metricsState.startedAtIso,
    model: GEMINI_MODEL,
    thinkingLevel: GEMINI_THINKING_LEVEL,
    requestsTotal: metricsState.requestsTotal,
    requestsServed: metricsState.requestsServed,
    requestsServedFromCache: metricsState.requestsServedFromCache,
    requestsServedByGemini: metricsState.requestsServedByGemini,
    requestsDeduplicated: metricsState.requestsDeduplicated,
    requestsRejected: metricsState.requestsRejected,
    rejections: { ...metricsState.rejections },
    errors429Total: metricsState.errors429Total,
    errors429Rpm: metricsState.errors429Rpm,
    errors429Daily: metricsState.errors429Daily,
    avgLatencyMs,
    latencySamples: metricsState.latencyCount,
    tokens: { ...metricsState.tokens },
    queue: {
      active: activeGeminiCount,
      waiting: waitQueue.length,
      maxConcurrent: MAX_CONCURRENT_GEMINI,
      maxQueueSize: MAX_QUEUE_SIZE,
    },
    cache: {
      size: conceptualCache.size,
      maxEntries: CACHE_MAX_ENTRIES,
      ttlMs: CACHE_TTL_MS,
      hits: metricsState.cache.hits,
      misses: metricsState.cache.misses,
    },
    circuitBreaker: {
      active: circuitActive,
      retryDelayKnown: circuitActive ? circuitBreakerState.retryDelayKnown : false,
      blockedUntilIso:
        circuitActive && circuitBreakerState.retryDelayKnown
          ? new Date(circuitBreakerState.blockedUntilMs).toISOString()
          : null,
    },
  };
}

function isLoopbackRemoteAddress(req) {
  const remote = String(req.socket?.remoteAddress || '').trim();
  return remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
}

function isMetricsAuthorized(req) {
  const configuredToken = (process.env.METRICS_TOKEN || '').trim();
  if (configuredToken) {
    const headerToken = String(req.headers['x-metrics-token'] || '').trim();
    const authHeader = String(req.headers.authorization || '').trim();
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : '';
    return headerToken === configuredToken || bearerToken === configuredToken;
  }
  // Sem METRICS_TOKEN configurado: bloqueia acesso na Vercel/rede externa e permite apenas loopback local
  return !process.env.VERCEL && isLoopbackRemoteAddress(req);
}

export async function handleMetricsRequest(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Método não permitido. Utilize GET.', code: 'METHOD_NOT_ALLOWED' });
    return;
  }
  if (!isMetricsAuthorized(req)) {
    sendJson(res, 401, { error: 'Acesso não autorizado às métricas.', code: 'UNAUTHORIZED' });
    return;
  }
  sendJson(res, 200, getMetricsSnapshot());
}

export async function handleChatRequest(req, res, options = {}) {
  const allowAnyPath = Boolean(options?.allowAnyPath);
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const pathname = (req.url || '/').split('?')[0];
  if (pathname === '/api/chat/metrics') {
    await handleMetricsRequest(req, res);
    return;
  }

  if (!allowAnyPath && pathname !== '/api/chat') {
    sendJson(res, 404, { error: 'Rota não encontrada.', code: 'NOT_FOUND' });
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Método não permitido. Utilize POST.', code: 'METHOD_NOT_ALLOWED' });
    return;
  }

  metricsState.requestsTotal += 1;
  const reqStartMs = Date.now();
  const injectedClient = options?.client || null;
  const hasApiKey = Boolean(injectedClient || (process.env.GEMINI_API_KEY || '').trim());

  const rateCheck = checkRateLimit(req);
  if (!rateCheck.allowed) {
    metricsState.requestsRejected += 1;
    metricsState.rejections.rateLimit += 1;
    sendJson(
      res,
      429,
      {
        error: rateCheck.message,
        code: rateCheck.reason,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
        diagnostics: {
          hasApiKey,
          model: GEMINI_MODEL,
          thinkingLevel: GEMINI_THINKING_LEVEL,
        },
      },
      { 'Retry-After': String(rateCheck.retryAfterSeconds) }
    );
    return;
  }

  const ai = injectedClient || getGeminiClient();
  if (!ai) {
    metricsState.requestsRejected += 1;
    metricsState.rejections.otherErrors += 1;
    console.warn('[API /api/chat] Bloqueado: GEMINI_API_KEY ausente no ambiente.');
    sendJson(res, 503, {
      error: 'Serviço do Tutor Inteligente indisponível: variável GEMINI_API_KEY não configurada no servidor.',
      code: 'API_KEY_MISSING',
      diagnostics: {
        hasApiKey: false,
        model: GEMINI_MODEL,
        thinkingLevel: GEMINI_THINKING_LEVEL,
        geminiHttpStatus: null,
      },
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    metricsState.requestsRejected += 1;
    metricsState.rejections.invalidRequest += 1;
    if (err?.statusCode === 413) {
      sendJson(res, 413, {
        error: 'A imagem ou mensagem enviada excede o tamanho máximo permitido (50 MB).',
        code: 'PAYLOAD_TOO_LARGE',
      });
      return;
    }
    sendJson(res, 400, {
      error: 'Corpo da requisição JSON inválido.',
      code: 'INVALID_JSON',
    });
    return;
  }

  const contents = sanitizeContents(body?.contents);
  const rawContext = sanitizeSimulationContext(body?.simulationContext);
  if (contents.length === 0) {
    metricsState.requestsRejected += 1;
    metricsState.rejections.invalidRequest += 1;
    sendJson(res, 400, {
      error: 'Envie uma mensagem de texto ou imagem válida para o Tutor Inteligente.',
      code: 'EMPTY_CONTENTS',
    });
    return;
  }

  const isConceptual = isStandaloneConceptualQuestion(contents);
  const effectiveContext = isConceptual ? '' : rawContext;
  const conceptualQuestionText = isConceptual
    ? contents[0].parts.map((p) => p.text || '').join(' ').trim()
    : '';

  console.info('[API /api/chat] Solicitação recebida:', {
    model: GEMINI_MODEL,
    thinkingLevel: GEMINI_THINKING_LEVEL,
    turnsCount: contents.length,
    hasImagePart: contents.some((item) => item.parts.some((part) => Boolean(part.inlineData))),
    hasSimulationContext: Boolean(effectiveContext),
    isStandaloneConceptual: isConceptual,
    queueWaiting: waitQueue.length,
    queueActive: activeGeminiCount,
  });

  // 1. Verifica cache conceitual estrito antes de acionar a API (economiza cota e tokens)
  let cacheKey = '';
  if (isConceptual) {
    const cached = getCachedConceptualAnswer(conceptualQuestionText);
    cacheKey = cached.key;
    if (cached.hit) {
      const elapsed = Date.now() - reqStartMs;
      metricsState.requestsServed += 1;
      metricsState.requestsServedFromCache += 1;
      metricsState.latencyTotalMs += elapsed;
      metricsState.latencyCount += 1;
      sendJson(res, 200, {
        text: cached.value.text,
        model: GEMINI_MODEL,
        thinkingLevel: GEMINI_THINKING_LEVEL,
        finishReason: cached.value.finishReason || 'STOP',
        cached: true,
      });
      return;
    }
  }

  // 2. Verifica circuit breaker de cota diária antes de enfileirar
  if (circuitBreakerState.blockedUntilMs > Date.now()) {
    metricsState.requestsRejected += 1;
    metricsState.rejections.dailyQuotaCircuitBreaker += 1;
    const classified = classifyGeminiError({ code: 'CIRCUIT_BREAKER_OPEN' });
    sendJson(
      res,
      429,
      {
        error: classified.message,
        code: classified.code,
        retryAfterSeconds: classified.retryAfterSeconds,
        diagnostics: {
          hasApiKey: true,
          model: GEMINI_MODEL,
          thinkingLevel: GEMINI_THINKING_LEVEL,
          geminiHttpStatus: 429,
          circuitBreakerActive: true,
          retryDelayKnown: classified.retryDelayKnown,
        },
      },
      classified.retryAfterSeconds
        ? { 'Retry-After': String(classified.retryAfterSeconds) }
        : {}
    );
    return;
  }

  // 3. Deduplicação em voo para requisições idênticas simultâneas
  const dedupKey = crypto
    .createHash('sha256')
    .update(JSON.stringify({ model: GEMINI_MODEL, thinking: GEMINI_THINKING_LEVEL, effectiveContext, contents }))
    .digest('hex');

  try {
    let pendingPromise = inFlightRequests.get(dedupKey);
    const isJoinedDedup = Boolean(pendingPromise);
    if (isJoinedDedup) {
      metricsState.requestsDeduplicated += 1;
    } else {
      const systemInstruction = buildSystemInstruction(effectiveContext);
      pendingPromise = callGeminiSerialized({ ai, systemInstruction, contents }).finally(() => {
        inFlightRequests.delete(dedupKey);
      });
      inFlightRequests.set(dedupKey, pendingPromise);
    }

    const response = await pendingPromise;
    const details = extractGeminiResponseDetails(response);
    const elapsed = Date.now() - reqStartMs;

    if (!details.hasText) {
      metricsState.requestsRejected += 1;
      metricsState.rejections.otherErrors += 1;
      sendJson(res, 502, {
        error: `O modelo Gemini (${GEMINI_MODEL}) respondeu sem conteúdo de texto (candidates=${details.candidatesCount}, parts=${details.partsCount}, finishReason=${details.finishReason || 'none'}${details.blockReason ? `, blockReason=${details.blockReason}` : ''}).`,
        code: 'EMPTY_RESPONSE',
        diagnostics: {
          hasApiKey: true,
          model: GEMINI_MODEL,
          thinkingLevel: GEMINI_THINKING_LEVEL,
          geminiHttpStatus: 200,
          candidatesCount: details.candidatesCount,
          hasContent: details.hasContent,
          partsCount: details.partsCount,
          hasText: false,
          finishReason: details.finishReason,
          blockReason: details.blockReason,
        },
      });
      return;
    }

    metricsState.requestsServed += 1;
    if (!isJoinedDedup) {
      metricsState.requestsServedByGemini += 1;
      if (details.usage) {
        metricsState.tokens.promptTokens += details.usage.promptTokens;
        metricsState.tokens.candidatesTokens += details.usage.candidatesTokens;
        metricsState.tokens.thoughtsTokens += details.usage.thoughtsTokens;
        metricsState.tokens.totalTokens += details.usage.totalTokens;
        metricsState.tokens.responsesWithUsage += 1;
      }
    }
    metricsState.latencyTotalMs += elapsed;
    metricsState.latencyCount += 1;

    if (isConceptual && cacheKey) {
      setCachedConceptualAnswer(cacheKey, {
        text: details.text,
        finishReason: details.finishReason,
      });
    }

    console.info('[API /api/chat] Resposta concluída:', {
      geminiHttpStatus: 200,
      model: GEMINI_MODEL,
      thinkingLevel: GEMINI_THINKING_LEVEL,
      latencyMs: elapsed,
      deduplicated: isJoinedDedup,
      finishReason: details.finishReason,
      usageTokens: details.usage?.totalTokens ?? null,
    });

    sendJson(res, 200, {
      text: details.text,
      model: GEMINI_MODEL,
      thinkingLevel: GEMINI_THINKING_LEVEL,
      finishReason: details.finishReason,
      cached: false,
      deduplicated: isJoinedDedup,
      usage: details.usage || undefined,
    });
  } catch (error) {
    const classified = classifyGeminiError(error);
    metricsState.requestsRejected += 1;
    if (classified.code === 'QUEUE_FULL') {
      metricsState.rejections.queueFull += 1;
    } else if (classified.code === 'QUOTA_EXCEEDED' && classified.isDailyFreeTier) {
      metricsState.rejections.dailyQuotaCircuitBreaker += 1;
    } else {
      metricsState.rejections.otherErrors += 1;
    }

    const logFn = classified.statusCode === 429 || classified.code === 'QUEUE_FULL' ? console.warn : console.error;
    logFn('[API /api/chat] Erro retornado pelo Gemini:', {
      model: GEMINI_MODEL,
      hasApiKey: true,
      geminiHttpStatus: classified.geminiHttpStatus,
      httpStatusReturned: classified.statusCode,
      code: classified.code,
      errorMessage: classified.rawMessage,
    });

    sendJson(
      res,
      classified.statusCode,
      {
        error: classified.message,
        code: classified.code,
        ...(classified.retryAfterSeconds ? { retryAfterSeconds: classified.retryAfterSeconds } : {}),
        diagnostics: {
          hasApiKey: true,
          model: GEMINI_MODEL,
          thinkingLevel: GEMINI_THINKING_LEVEL,
          geminiHttpStatus: classified.geminiHttpStatus,
          retryDelayKnown: classified.retryDelayKnown,
          detail: classified.rawMessage || undefined,
        },
      },
      classified.retryAfterSeconds ? { 'Retry-After': String(classified.retryAfterSeconds) } : {}
    );
  }
}

export default handleChatRequest;

const STATIC_MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function parseCliPort(argv) {
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--port' && argv[i + 1]) {
      const parsed = Number(argv[i + 1]);
      if (Number.isInteger(parsed) && parsed > 0) return parsed;
    }
    if (arg.startsWith('--port=')) {
      const parsed = Number(arg.slice('--port='.length));
      if (Number.isInteger(parsed) && parsed > 0) return parsed;
    }
  }
  return 0;
}

function serveStaticDist(req, res, distDir) {
  const rawPathname = (req.url || '/').split('?')[0];
  let decodedPath = '/';
  try {
    decodedPath = decodeURIComponent(rawPathname);
  } catch {
    decodedPath = '/';
  }

  const normalized = path.posix.normalize(decodedPath).replace(/^(\.\.(\/|\\|$))+/, '');
  let targetPath = path.join(distDir, normalized === '/' ? 'index.html' : normalized);

  if (!targetPath.startsWith(distDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    targetPath = path.join(distDir, 'index.html');
  }

  if (!fs.existsSync(targetPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Build dist/ não encontrado. Execute "npm run build".');
    return;
  }

  const ext = path.extname(targetPath).toLowerCase();
  const contentType = STATIC_MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(targetPath).pipe(res);
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectExecution && !process.env.VERCEL) {
  const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');
  const isApiOnly = process.argv.includes('--api-only');
  const cliPort = parseCliPort(process.argv);
  const envPort =
    Number(
      process.env.API_PORT ||
        (isProd && !process.env.GOOGLE_RUNTIME ? process.env.PORT : '')
    ) || 0;
  const port = cliPort || envPort || 3000;
  const host = '0.0.0.0';
  const distDir = path.join(__dirname, 'dist');

  let viteServer = null;
  if (!isProd && !isApiOnly) {
    const { createServer: createViteServer } = await import('vite');
    viteServer = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
  }

  const server = http.createServer(async (req, res) => {
    const pathname = (req.url || '/').split('?')[0];

    if (pathname === '/api/chat/metrics') {
      await handleMetricsRequest(req, res);
      return;
    }

    if (pathname === '/api/chat') {
      await handleChatRequest(req, res);
      return;
    }

    if (pathname.startsWith('/api/')) {
      sendJson(res, 404, { error: 'Rota de API não encontrada.', code: 'NOT_FOUND' });
      return;
    }

    if (viteServer) {
      viteServer.middlewares(req, res);
      return;
    }

    if (isApiOnly) {
      sendJson(res, 404, { error: 'Rota não encontrada.', code: 'NOT_FOUND' });
      return;
    }

    serveStaticDist(req, res, distDir);
  });

  server.listen(port, host, () => {
    const modeLabel = isApiOnly ? 'API-only' : isProd ? 'produção (dist/)' : 'dev (Vite middleware)';
    console.log(`Servidor EUREKA (${modeLabel}) rodando em http://${host}:${port} (modelo Gemini: ${GEMINI_MODEL}, thinkingLevel: ${GEMINI_THINKING_LEVEL})`);
  });
}
