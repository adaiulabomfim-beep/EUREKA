import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

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

const GEMINI_MODEL = (process.env.GEMINI_MODEL || '').trim() || 'gemini-4-hydrogen';
const MAX_BODY_BYTES = 50 * 1024 * 1024; // 50 MB para uploads de imagem em Base64

const SYSTEM_INSTRUCTION =
  'Você é um assistente tutor especialista em Mecânica dos Fluidos, especificamente Hidrostática e Empuxo. Você está integrado em uma aplicação web educacional. O usuário pode enviar dados de uma simulação (Contexto do Laboratório). Use esses dados numéricos precisos para explicar o que está acontecendo fisicamente. Explique conceitos como se fosse um professor universitário didático. IMPORTANTE: NÃO use formatação LaTeX (como $...$, \\text{}, ou ^ para expoentes). Escreva as unidades de medida em texto simples e limpo (exemplo: kg/m³, N, m², Pa). Não use símbolos que poluam a leitura.';

let cachedApiKey = '';
let cachedClient = null;

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
  }
  return cachedClient;
}

if (!(process.env.GEMINI_API_KEY || '').trim()) {
  console.warn(
    'AVISO: GEMINI_API_KEY não configurada no ambiente do servidor. A rota /api/chat retornará erro até que a variável seja definida.'
  );
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

  const sanitized = [];
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
      sanitized.push({ role, parts });
    }
  }

  return sanitized;
}

function sanitizeErrorMessage(raw) {
  return String(raw || '')
    .replace(/([?&]key=)[^&\s"']+/gi, '$1[REDACTED]')
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, '[REDACTED]');
}

function classifyGeminiError(error) {
  const status = Number(error?.status || error?.statusCode || error?.code || 0);
  const rawMessage = sanitizeErrorMessage(error?.message || '');
  const upperMsg = rawMessage.toUpperCase();

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
    return {
      statusCode: 429,
      geminiHttpStatus: status || 429,
      rawMessage,
      code: 'QUOTA_EXCEEDED',
      message: 'Limite de cota ou taxa de requisições da API Gemini excedido. Tente novamente em alguns instantes.',
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

  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    upperMsg.includes('FETCH FAILED') ||
    upperMsg.includes('ECONNREFUSED') ||
    upperMsg.includes('ENOTFOUND') ||
    upperMsg.includes('ETIMEDOUT') ||
    upperMsg.includes('NETWORK') ||
    upperMsg.includes('UNAVAILABLE')
  ) {
    return {
      statusCode: 503,
      geminiHttpStatus: status || 503,
      rawMessage,
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'Falha de comunicação com os servidores do Google Gemini. Tente novamente em instantes.',
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
  };
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
  if (!allowAnyPath && pathname !== '/api/chat') {
    sendJson(res, 404, { error: 'Rota não encontrada.', code: 'NOT_FOUND' });
    return;
  }

  const hasApiKey = Boolean((process.env.GEMINI_API_KEY || '').trim());
  console.info('[API /api/chat] Requisição recebida:', {
    method: req.method,
    pathname,
    allowAnyPath,
    hasApiKey,
    model: GEMINI_MODEL,
  });

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Método não permitido. Utilize POST.', code: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.warn('[API /api/chat] Bloqueado: GEMINI_API_KEY ausente no ambiente.');
    sendJson(res, 503, {
      error: 'Serviço do Tutor Inteligente indisponível: variável GEMINI_API_KEY não configurada no servidor.',
      code: 'API_KEY_MISSING',
      diagnostics: {
        hasApiKey: false,
        model: GEMINI_MODEL,
        geminiHttpStatus: null,
      },
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
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
  console.info('[API /api/chat] Payload analisado:', {
    hasBody: Boolean(body && typeof body === 'object'),
    hasRawContents: Array.isArray(body?.contents),
    rawContentsCount: Array.isArray(body?.contents) ? body.contents.length : 0,
    sanitizedContentsCount: contents.length,
    roles: contents.map((item) => item.role),
    hasImagePart: contents.some((item) => item.parts.some((part) => Boolean(part.inlineData))),
  });

  if (contents.length === 0) {
    sendJson(res, 400, {
      error: 'Envie uma mensagem de texto ou imagem válida para o Tutor Inteligente.',
      code: 'EMPTY_CONTENTS',
    });
    return;
  }

  try {
    let response;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
          contents,
        });
        break;
      } catch (attemptError) {
        const status = Number(attemptError?.status || attemptError?.statusCode || attemptError?.code || 0);
        const msg = String(attemptError?.message || '').toUpperCase();
        const isTransient =
          status === 503 || status === 504 || msg.includes('UNAVAILABLE') || msg.includes('HIGH DEMAND');
        if (!isTransient || attempt === maxAttempts) {
          throw attemptError;
        }
        const delayMs = 600 * attempt;
        console.warn(`[API /api/chat] Erro transitório (${status || 'UNAVAILABLE'}), tentativa ${attempt}/${maxAttempts}; aguardando ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const details = extractGeminiResponseDetails(response);
    console.info('[API /api/chat] Resposta Gemini recebida:', {
      geminiHttpStatus: 200,
      model: GEMINI_MODEL,
      candidatesCount: details.candidatesCount,
      hasContent: details.hasContent,
      partsCount: details.partsCount,
      hasText: details.hasText,
      finishReason: details.finishReason,
      blockReason: details.blockReason,
    });

    if (!details.hasText) {
      sendJson(res, 502, {
        error: `O modelo Gemini (${GEMINI_MODEL}) respondeu sem conteúdo de texto (candidates=${details.candidatesCount}, parts=${details.partsCount}, finishReason=${details.finishReason || 'none'}${details.blockReason ? `, blockReason=${details.blockReason}` : ''}).`,
        code: 'EMPTY_RESPONSE',
        diagnostics: {
          hasApiKey: true,
          model: GEMINI_MODEL,
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

    sendJson(res, 200, {
      text: details.text,
      model: GEMINI_MODEL,
      finishReason: details.finishReason,
    });
  } catch (error) {
    const classified = classifyGeminiError(error);
    console.error('[API /api/chat] Erro retornado pelo Gemini:', {
      model: GEMINI_MODEL,
      hasApiKey: true,
      geminiHttpStatus: classified.geminiHttpStatus,
      httpStatusReturned: classified.statusCode,
      code: classified.code,
      errorMessage: classified.rawMessage,
    });
    sendJson(res, classified.statusCode, {
      error: classified.message,
      code: classified.code,
      diagnostics: {
        hasApiKey: true,
        model: GEMINI_MODEL,
        geminiHttpStatus: classified.geminiHttpStatus,
        detail: classified.rawMessage || undefined,
      },
    });
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
    console.log(`Servidor EUREKA (${modeLabel}) rodando em http://${host}:${port} (modelo Gemini: ${GEMINI_MODEL})`);
  });
}
