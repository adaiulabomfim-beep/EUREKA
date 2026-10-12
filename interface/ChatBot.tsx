
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
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

export const ChatBot: React.FC<ChatBotProps> = ({ simulationContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Se o usuário pediu explicação do ensaio e temos contexto, adicionamos o contexto à mensagem do usuário de forma oculta para a IA
    // ou simplesmente concatenamos para garantir que a IA veja.
    let fullPrompt = textToSend;
    
    // Check if the message implies asking about the simulation
    const isAskingAboutSimulation = textToSend.toLowerCase().includes('ensaio') || textToSend.toLowerCase().includes('simulação') || textToSend.toLowerCase().includes('experimento');
    
    // If context exists and user is likely asking about it, prepend context.
    // To be safe and helpful, if the context is available, we attach it as system info for the turn.
    if (simulationContext && isAskingAboutSimulation) {
        fullPrompt = `${simulationContext}\n\nPergunta do usuário: ${textToSend}`;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      text: textToSend, // We show the original clean text in UI
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
      const ai = new GoogleGenAI(apiKey ? { apiKey } : {});
      
      const contents = messages.map(msg => {
        const parts: any[] = [{ text: msg.text }];
        if (msg.image) {
            const [metadata, base64Data] = msg.image.split(',');
            const mimeType = metadata.match(/:(.*?);/)?.[1] || 'image/png';
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
        }
        return {
          role: msg.role,
          parts: parts
        };
      });

      // Add current message with potentially augmented prompt
      const currentParts: any[] = [{ text: fullPrompt }];
      if (userMessage.image) {
          const [metadata, base64Data] = userMessage.image.split(',');
          const mimeType = metadata.match(/:(.*?);/)?.[1] || 'image/png';
          currentParts.push({
              inlineData: {
                  mimeType: mimeType,
                  data: base64Data
              }
          });
      }
      
      contents.push({ role: 'user', parts: currentParts });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        config: {
            systemInstruction: "Você é um assistente tutor especialista em Mecânica dos Fluidos, especificamente Hidrostática e Empuxo. Você está integrado em uma aplicação web educacional. O usuário pode enviar dados de uma simulação (Contexto do Laboratório). Use esses dados numéricos precisos para explicar o que está acontecendo fisicamente. Explique conceitos como se fosse um professor universitário didático. IMPORTANTE: NÃO use formatação LaTeX (como $...$, \\text{}, ou ^ para expoentes). Escreva as unidades de medida em texto simples e limpo (exemplo: kg/m³, N, m², Pa). Não use símbolos que poluam a leitura.",
        },
        contents: contents
      });

      const responseText = response.text || "Desculpe, não consegui gerar uma resposta.";

      setMessages(prev => [...prev, {
        role: 'model',
        text: responseText
      }]);

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "Desculpe, ocorreu um erro ao conectar com o servidor. Verifique sua chave API ou tente novamente."
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
                <p className="text-[9px] text-blue-100 dark:text-slate-400 font-bold uppercase tracking-wider">Powered by Gemini 3.1 Pro</p>
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
