require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;

// Configurações aprimoradas
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://seusite.com' : '*'
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public', { maxAge: '1d' }));

// Constantes melhor organizadas
const TOPICS_PERMITIDOS = new Set([
  'furia', 'esports', 'csgo', 'valorant',
  'jogadores', 'campeonato', 'equipe', 'e-sports'
]);

const LINKS_OFICIAIS = {
  site: 'https://furia.gg',
  instagram: 'https://instagram.com/furiagg',
  twitter: 'https://x.com/FURIA',
  youtubeVALORANT: 'https://www.youtube.com/@FURIAggVAL',
  youtubeR6: 'https://www.youtube.com/@FURIAggR6',
  youtubeCSGO: 'https://www.youtube.com/@FURIAggCS',
};

// Middleware de segurança
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Endpoint principal
app.post('/chat', async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validação reforçada
    if (!prompt || typeof prompt !== 'string' || prompt.length > 500) {
      return res.status(400).json({ 
        error: 'Prompt inválido. Máximo 500 caracteres permitidos.' 
      });
    }

    // Verificação de links otimizada
    if (/(link|site|rede social|youtube|twitter|instagram)/i.test(prompt)) {
      return res.json({
        resposta: formatarLinksResposta(LINKS_OFICIAIS)
      });
    }

    // Verificação de contexto
    const palavras = new Set(prompt.toLowerCase().split(/\W+/));
    const contextoValido = [...palavras].some(palavra =>
      TOPICS_PERMITIDOS.has(palavra)
    );

    if (!contextoValido) {
      return res.json({
        resposta: "Sou especializado na FURIA Esports. Pergunte sobre:\n" +
                  "- Jogadores e equipes\n- Histórico de campeonatos\n" +
                  "- Estratégias de jogo\n- Notícias recentes"
      });
    }

    const anoAtual = new Date().getFullYear();
    const resposta = await processarPromptGemini(prompt, anoAtual);

    res.json({ resposta });

  } catch (error) {
    console.error('Erro:', formatarErro(error));
    const status = error.response?.status || 500;
    res.status(status).json({ 
      error: obterMensagemErroAmigavel(error) 
    });
  }
});

// Funções auxiliares
function formatarLinksResposta(links) {
  return Object.entries(links)
    .map(([plataforma, url]) => {
      const nomeFormatado = plataforma
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      return `• ${nomeFormatado}: ${url}`;
    })
    .join('\n');
}

function formatarErro(error) {
  return error?.response?.data || error?.message || 'Erro desconhecido';
}

function obterMensagemErroAmigavel(error) {
  return 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.';
}

async function processarPromptGemini(prompt, anoAtual) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await axios.post(url, {
    contents: [{
      parts: [{ text: `[Data: ${anoAtual}] ${prompt}` }]
    }],
    systemInstruction: {
      parts: [{
        text: `Você é um especialista técnico da FURIA Esports. Diretrizes:
        1. Sempre atualize as informações (Ano: ${anoAtual})
        2. Priorize dados oficiais do site da FURIA
        3. Formate respostas em markdown simples
        4. Inclua datas relevantes`
      }]
    },
    safetySettings: [{
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    }]
  }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000
  });

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text
    || "Não foi possível gerar uma resposta no momento";
}

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
