
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Image as ImageIcon, Loader2, Bot, User, Trash2, Microscope } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 data string
}

interface ChatBotProps {
    simulationContext?: string;
}

// Renderizador com formatação Markdown limpa (negrito, itálico, listas e destaques)
const renderFormattedText = (rawText: string, isUser: boolean) => {
  const lines = rawText.split('\n');

  return lines.map((line, lineIdx) => {
    const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ');
    const isNumbered = /^\s*\d+[\.\)]\s+/.test(line);

    let content = line;
    let prefix = null;

    if (isBullet) {
      prefix = <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 mt-2 shrink-0 ${isUser ? 'bg-white' : 'bg-blue-500'}`} />;
      content = line.replace(/^\s*[-*•]\s+/, '');
    } else if (isNumbered) {
      const match = line.match(/^\s*(\d+[\.\)])\s+(.*)/);
      if (match) {
        prefix = <span className={`font-bold mr-1.5 shrink-0 ${isUser ? 'text-blue-100' : 'text-blue-600'}`}>{match[1]}</span>;
        content = match[2];
      }
    }

    // Tokenizador para ***negrito-itálico***, **negrito**, *itálico*, `código/unidade`
    const parts = content.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    const formattedParts = parts.map((part, partIdx) => {
      if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
        return (
          <strong key={partIdx} className={`font-extrabold italic ${isUser ? 'text-white' : 'text-slate-900 font-bold'}`}>
            {part.slice(3, -3)}
          </strong>
        );
      }
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={partIdx} className={`font-bold ${isUser ? 'text-white font-extrabold' : 'text-slate-900'}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={partIdx} className={`italic ${isUser ? 'text-blue-100' : 'text-slate-800'}`}>
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code key={partIdx} className={`px-1 py-0.5 rounded text-xs font-mono ${isUser ? 'bg-blue-700/60 text-white' : 'bg-slate-100 text-blue-700 border border-slate-200'}`}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });

    if (isBullet || isNumbered) {
      return (
        <div key={lineIdx} className="flex items-start my-1 text-sm leading-relaxed">
          {prefix}
          <div className="flex-1">{formattedParts}</div>
        </div>
      );
    }

    if (!line.trim()) {
      return <div key={lineIdx} className="h-2" />;
    }

    return (
      <div key={lineIdx} className="my-1 text-sm leading-relaxed">
        {formattedParts}
      </div>
    );
  });
};

const MAX_OUTBOUND_MESSAGES = 12; // Até 6 turnos enviados à API
const SEND_COOLDOWN_MS = 1000;
const DUPLICATE_WINDOW_MS = 5000;
const SESSION_STORAGE_KEY = 'eureka_tutor_session_id';

function getOrCreateSessionHint(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) {
      return existing;
    }
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `sess_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `mem_${Math.random().toString(36).slice(2, 12)}`;
  }
}

export const ChatBot: React.FC<ChatBotProps> = ({ simulationContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availabilityNotice, setAvailabilityNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSentAtRef = useRef<number>(0);
  const lastSubmissionRef = useRef<{ signature: string; at: number } | null>(null);
  const sessionHintRef = useRef<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (forcedText?: string) => {
    const textToSend = forcedText || input;
    if ((!textToSend.trim() && !selectedImage) || isLoading) return;

    const now = Date.now();
    const activeContext = simulationContext?.trim() || '';
    const trimmedText = textToSend.trim();
    const imageToAttach = forcedText ? undefined : (selectedImage || undefined);

    if (lastSentAtRef.current > 0 && now - lastSentAtRef.current < SEND_COOLDOWN_MS) {
      const waitSec = Math.max(1, Math.ceil((SEND_COOLDOWN_MS - (now - lastSentAtRef.current)) / 1000));
      setAvailabilityNotice(`Aguarde ${waitSec}s antes de enviar outra pergunta.`);
      return;
    }

    const submissionSignature = `${trimmedText}::${imageToAttach ? imageToAttach.length : 0}::${activeContext}`;
    if (
      lastSubmissionRef.current &&
      lastSubmissionRef.current.signature === submissionSignature &&
      now - lastSubmissionRef.current.at < DUPLICATE_WINDOW_MS
    ) {
      setAvailabilityNotice('Esta mesma pergunta acabou de ser enviada. Aguarde antes de repetir.');
      return;
    }

    setAvailabilityNotice(null);
    lastSentAtRef.current = now;
    lastSubmissionRef.current = { signature: submissionSignature, at: now };

    if (!sessionHintRef.current) {
      sessionHintRef.current = getOrCreateSessionHint();
    }

    const userMessage: ChatMessage = {
      role: 'user',
      text: textToSend,
      image: imageToAttach,
    };

    const previousMessages = messages;
    setMessages(prev => [...prev, userMessage]);
    if (!forcedText) {
      setInput('');
      setSelectedImage(null);
    }
    setIsLoading(true);

    try {
      const buildParts = (text: string, image?: string) => {
        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
        if (text) {
          parts.push({ text });
        }
        if (image) {
          const commaIdx = image.indexOf(',');
          const metadata = commaIdx >= 0 ? image.slice(0, commaIdx) : '';
          const base64Data = commaIdx >= 0 ? image.slice(commaIdx + 1) : image;
          const mimeType = metadata.match(/:(.*?);/)?.[1] || 'image/png';
          if (base64Data) {
            parts.push({
              inlineData: {
                mimeType,
                data: base64Data,
              },
            });
          }
        }
        return parts;
      };

      // Reduz o histórico enviado aos últimos turnos mantendo imagens necessárias à compreensão:
      // preserva a imagem da mensagem atual e a imagem mais recente anterior dentro da janela.
      const outboundWindow = [...previousMessages, userMessage].slice(-MAX_OUTBOUND_MESSAGES);
      const lastIdx = outboundWindow.length - 1;
      let keptPriorImage = false;
      const includeImageFlags = outboundWindow.map(() => false);
      for (let i = lastIdx; i >= 0; i -= 1) {
        if (!outboundWindow[i].image) continue;
        if (i === lastIdx) {
          includeImageFlags[i] = true;
        } else if (!keptPriorImage) {
          includeImageFlags[i] = true;
          keptPriorImage = true;
        }
      }

      const contents = outboundWindow.map((msg, idx) =>
        ({
          role: msg.role,
          parts: buildParts(
            msg.text || (!includeImageFlags[idx] && msg.image ? '[Imagem anterior omitida]' : ''),
            includeImageFlags[idx] ? msg.image : undefined
          ),
        })
      );

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Eureka-Session': sessionHintRef.current,
        },
        body: JSON.stringify({
          contents,
          ...(activeContext ? { simulationContext: activeContext } : {}),
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      const rawResponseBody = await response.text().catch(() => '');

      let payload: {
        text?: unknown;
        error?: unknown;
        code?: unknown;
        retryAfterSeconds?: unknown;
        finishReason?: unknown;
        diagnostics?: {
          model?: unknown;
          geminiHttpStatus?: unknown;
          finishReason?: unknown;
        };
      } | null = null;

      if (rawResponseBody.trim()) {
        try {
          payload = JSON.parse(rawResponseBody);
        } catch {
          payload = null;
        }
      }

      console.info('[ChatBot /api/chat] Diagnóstico da resposta:', {
        httpStatus: response.status,
        ok: response.ok,
        contentType: contentType || '(vazio)',
        isJsonPayload: Boolean(payload && typeof payload === 'object'),
        hasTextProperty: Boolean(payload && typeof payload.text === 'string' && payload.text.trim()),
        code: payload?.code || null,
        diagnostics: payload?.diagnostics || null,
      });

      if (!contentType.includes('application/json') || !payload || typeof payload !== 'object') {
        const previewType = contentType || 'conteúdo desconhecido';
        if (response.status === 404) {
          throw new Error(
            `Rota /api/chat não encontrada (HTTP 404, Content-Type: ${previewType}). Verifique se a função serverless api/chat.js (Vercel) ou o backend server.js está publicado e ativo.`
          );
        }
        throw new Error(
          `A rota /api/chat respondeu HTTP ${response.status} com formato "${previewType}" em vez de JSON válido. Isso indica que a requisição não atingiu a função serverless api/chat.js ou o backend server.js.`
        );
      }

      if (!response.ok) {
        const serverError = typeof payload.error === 'string' ? payload.error : '';
        const errorCode = typeof payload.code === 'string' ? payload.code : '';
        const modelInfo =
          payload.diagnostics && typeof payload.diagnostics.model === 'string'
            ? ` | modelo: ${payload.diagnostics.model}`
            : '';
        const geminiStatusInfo =
          payload.diagnostics && typeof payload.diagnostics.geminiHttpStatus === 'number'
            ? ` | Gemini HTTP: ${payload.diagnostics.geminiHttpStatus}`
            : '';

        const handledMessage = serverError
          ? `${serverError} (HTTP ${response.status}${errorCode ? ` / ${errorCode}` : ''}${modelInfo}${geminiStatusInfo})`
          : `Erro na API /api/chat (HTTP ${response.status}${errorCode ? ` / ${errorCode}` : ''}${modelInfo}${geminiStatusInfo}).`;

        if (response.status === 429 || errorCode === 'QUEUE_FULL') {
          setAvailabilityNotice(serverError || 'Tutor temporariamente indisponível por limite de utilização.');
        }

        console.warn('[ChatBot /api/chat] Resposta de erro tratada:', handledMessage);
        setMessages(prev => [...prev, {
          role: 'model',
          text: handledMessage
        }]);
        return;
      }

      if (typeof payload.text !== 'string' || !payload.text.trim()) {
        const finishReason =
          typeof payload.finishReason === 'string'
            ? payload.finishReason
            : payload.diagnostics && typeof payload.diagnostics.finishReason === 'string'
            ? payload.diagnostics.finishReason
            : '';
        console.error('[ChatBot /api/chat] Resposta HTTP 200 sem propriedade "text" válida:', {
          httpStatus: response.status,
          payloadKeys: Object.keys(payload),
          finishReason: finishReason || null,
        });
        throw new Error(
          `A API /api/chat retornou HTTP ${response.status}, mas sem conteúdo na propriedade "text"${finishReason ? ` (finishReason: ${finishReason})` : ''}.`
        );
      }

      const responseText = payload.text;

      setMessages(prev => [...prev, {
        role: 'model',
        text: responseText
      }]);

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage =
        error instanceof TypeError
          ? "Não foi possível conectar ao servidor do Tutor Inteligente (/api/chat). Verifique sua conexão ou se o backend está ativo."
          : error instanceof Error && error.message
          ? error.message
          : "Ocorreu um erro inesperado ao processar a resposta do Tutor Inteligente.";

      setMessages(prev => [...prev, {
        role: 'model',
        text: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          id="tour-btn-tutor"
          data-tour="tutor-ia"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center gap-2 group shadow-blue-500/20"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap font-black text-[10px] uppercase tracking-widest">
            Tutor IA
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-[400px] h-[600px] max-h-[80vh] bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col border border-blue-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 transition-colors">
          {/* Header */}
          <div className="bg-blue-600 dark:bg-slate-800 p-4 flex items-center justify-between text-white shrink-0 shadow-lg shadow-blue-500/10 dark:shadow-none border-b border-transparent dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-[10px] uppercase tracking-widest leading-tight">Tutor Inteligente</h3>
                <p className="text-[9px] text-blue-100 dark:text-slate-400 font-bold uppercase tracking-wider">Powered by Gemini Flash</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/60">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 dark:text-slate-500 mt-10 space-y-3">
                <div className="bg-blue-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Bot className="w-8 h-8 text-blue-200 dark:text-blue-400" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">Olá! Sou seu assistente de física.</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider max-w-[200px] mx-auto">Pergunte sobre empuxo, pressão ou peça uma análise da simulação atual.</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`
                  w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                  ${msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400' : 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400'}
                `}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                <div className={`
                  max-w-[80%] rounded-2xl p-3 text-sm shadow-md
                  ${msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-100 border border-blue-50 dark:border-slate-700 rounded-tl-none'}
                `}>
                  {msg.image && (
                    <img 
                      src={msg.image} 
                      alt="Upload user" 
                      className="w-full h-auto rounded-xl mb-2 border border-white/20 shadow-sm"
                    />
                  )}
                  <div className="leading-relaxed font-medium">
                    {renderFormattedText(msg.text, msg.role === 'user')}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                 </div>
                 <div className="bg-white/90 dark:bg-slate-800/90 border border-blue-50 dark:border-slate-700 rounded-2xl rounded-tl-none p-4 shadow-md">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/90 dark:bg-slate-900/90 border-t border-blue-50 dark:border-slate-800 shrink-0 transition-colors">
            {availabilityNotice && (
              <div className="mb-2.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/70 text-[11px] font-medium text-amber-800 dark:text-amber-200 leading-snug">
                {availabilityNotice}
              </div>
            )}
            
            {/* Context Suggestion */}
            {simulationContext && !isLoading && messages.length < 2 && (
               <button 
                  onClick={() => handleSend("Explique o que aconteceu neste último ensaio.")}
                  className="mb-3 w-full text-left bg-blue-50/50 dark:bg-slate-800/80 hover:bg-blue-100/50 dark:hover:bg-slate-800 p-3 rounded-xl border border-blue-100/50 dark:border-slate-700 flex items-center gap-3 text-[9px] text-blue-700 dark:text-blue-300 font-black uppercase tracking-widest transition-all active:scale-[0.98]"
               >
                  <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                    <Microscope className="w-3.5 h-3.5" />
                  </div>
                  Explicar o Ensaio Atual
               </button>
            )}

            {/* Image Preview */}
            {selectedImage && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50/30 dark:bg-slate-800/60 rounded-xl border border-blue-100/50 dark:border-slate-700">
                <img src={selectedImage} alt="Preview" className="h-10 w-10 object-cover rounded-lg shadow-sm" />
                <span className="text-[9px] text-slate-400 flex-1 truncate font-black uppercase tracking-widest">Imagem anexada</span>
                <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex items-end gap-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageSelect}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90"
                title="Anexar imagem"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua dúvida..."
                  className="w-full max-h-[100px] min-h-[48px] py-3.5 px-4 bg-slate-50/50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 resize-none font-medium transition-all"
                  rows={1}
                  style={{ minHeight: '48px' }}
                />
              </div>
              
              <button 
                onClick={() => handleSend()}
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className="p-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-90"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
