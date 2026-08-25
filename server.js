import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Use express.json with a large limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Initialize Gemini API (only if key exists so it doesn't crash on boot)
const apiKey = process.env.GEMINI_API_KEY;
let ai = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn("⚠️ AVISO: GEMINI_API_KEY não foi encontrada no ambiente (crie um arquivo .env). O ChatBot não funcionará.");
}

app.post('/api/chat', async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: 'Chave da API Gemini ausente no servidor. Configure o arquivo .env com GEMINI_API_KEY.' });
  }

  try {
    const { contents } = req.body;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      config: {
          systemInstruction: "Você é um assistente tutor especialista em Mecânica dos Fluidos, especificamente Hidrostática e Empuxo. Você está integrado em uma aplicação web educacional. O usuário pode enviar dados de uma simulação (Contexto do Laboratório). Use esses dados numéricos precisos para explicar o que está acontecendo fisicamente. Explique conceitos como se fosse um professor universitário didático. IMPORTANTE: NÃO use formatação LaTeX (como $...$, \\text{}, ou ^ para expoentes). Escreva as unidades de medida em texto simples e limpo (exemplo: kg/m³, N, m², Pa). Não use símbolos que poluam a leitura.",
      },
      contents: contents
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Erro na API Gemini:", error);
    
    // Verifica se é erro de API KEY
    if (error.status === 400 && error.message?.includes('API_KEY_INVALID')) {
       return res.status(400).json({ error: 'A chave da API (GEMINI_API_KEY) configurada no arquivo .env é inválida. Por favor, insira uma chave real do Google AI Studio.' });
    }

    // Verifica se é erro de limite de cota (Rate Limit)
    if (error.status === 429) {
       return res.status(429).json({ error: 'Você atingiu o limite de uso gratuito da sua API Key do Google (Quota Exceeded). Tente novamente em alguns minutos.' });
    }

    res.status(500).json({ error: 'Erro ao gerar resposta com a IA.' });
  }
});

app.listen(port, () => {
  console.log(`Backend rodando na porta ${port}`);
});
