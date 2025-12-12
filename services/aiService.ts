

import { GoogleGenAI } from "@google/genai";
import { DashboardData, GroundingSource, StudyPlan, StudyDay } from "../types/index";
import { Question, MOCK_EXAM_QUESTIONS } from "../data/mockData";

// Lista de chaves de backup para rotação (Load Balancing)
const BACKUP_KEYS = [
  "AIzaSyCWW0ceQB-HRxHty1ZG4t-4oXnotEXxsa4",
  "AIzaSyDfWCkj6lMuU4odzcbPg78qzmO0glICmgk",
  "AIzaSyAUGTsWhhPhxDyxW-mGcFTcEI6-NwqqGQ4",
  "AIzaSyC4Sdpcx7G63IBSrUBftZFSQe9Y0DS7OJU",
  "AIzaSyCui7LVbad48fafZum8oAQj1Fu2olOmAHs",
  "AIzaSyD5RAAsmgV7YMblHLC3LgN8kJE5k4M_6FA",
  "AIzaSyAPrE-r_n_ZZTkrwuu6RzimYGuo4aRyrFY",
  "AIzaSyBbSYF4ZeICWR_dsGh4y2VQBg0roXNrWjI",
  "AIzaSyDEsz3q0rOxGeDS179VbsONeUpHC8ek2SE"
];

// Função auxiliar para obter uma chave de API válida do pool (aleatória)
const getApiKey = (): string | undefined => {
  const allKeys = [process.env.API_KEY, ...BACKUP_KEYS].filter(k => !!k && k.trim() !== "");
  if (allKeys.length === 0) return undefined;
  return allKeys[Math.floor(Math.random() * allKeys.length)] as string;
};

// Função auxiliar para obter TODAS as chaves embaralhadas para tentativas exaustivas
const getAllKeysShuffled = (): string[] => {
  const allKeys = [process.env.API_KEY, ...BACKUP_KEYS].filter(k => !!k && k.trim() !== "");
  const uniqueKeys = [...new Set(allKeys as string[])];
  
  // Fisher-Yates shuffle
  for (let i = uniqueKeys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniqueKeys[i], uniqueKeys[j]] = [uniqueKeys[j], uniqueKeys[i]];
  }
  return uniqueKeys;
};

// Fallback data caso a API falhe ou não haja chave
const FALLBACK_DATA: DashboardData = {
  examDate: null,
  events: [
    { date: "A definir", title: "Aguardando Edital Oficial", type: "info" },
    { date: "Previsto", title: "Inscrições (Estimativa)", type: "deadline" },
  ],
  tipOfTheDay: "Enquanto o calendário oficial não sai, foque em fortalecer sua base em Matemática e Português."
};

export interface ChatHistoryItem {
  role: 'user' | 'ai';
  text: string;
}

export interface StudyContent {
  concept: string;
  application: string;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

export interface VideoRecommendation {
  title: string;
  channelName: string;
  description: string;
}

export const fetchRealEtecData = async (): Promise<{ data: DashboardData; sources: GroundingSource[] }> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("Nenhuma API Key disponível. Usando dados de fallback.");
      return { data: FALLBACK_DATA, sources: [] };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const today = new Date().toLocaleDateString('pt-BR');
    const currentYear = new Date().getFullYear();

    const prompt = `
      Hoje é dia ${today}. Você é um assistente oficial para estudantes da ETEC.
      
      TAREFA CRÍTICA:
      Use o Google Search para encontrar o "Calendário Vestibulinho ETEC" mais recente (referente ao próximo processo seletivo do ano de ${currentYear} ou ${currentYear + 1}).
      Busque datas oficiais no site vestibulinhoetec.com.br ou em portais de notícias como G1 e Guia do Estudante.

      Eu preciso extrair:
      1. A data exata da próxima PROVA (Vestibulinho). Se o edital ainda não saiu, procure por "previsão data prova etec ${currentYear}".
      2. 3 a 4 datas importantes confirmadas ou previstas (Início das inscrições, Fim das inscrições, Data da Prova, Divulgação de Gabarito).
      3. Uma dica de estudo motivacional curta para hoje.

      Retorne APENAS um JSON válido. Não use Markdown. A estrutura deve ser EXATAMENTE esta:
      {
        "examDate": "YYYY-MM-DD", (ou null se a data da prova ainda não foi divulgada oficialmente)
        "events": [
          { "date": "DD/MMM", "title": "Nome do Evento", "type": "exam" | "deadline" | "result" | "info" }
        ],
        "tipOfTheDay": "Texto da dica"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const textResponse = response.text || "";
    
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        sources.push({
          title: chunk.web.title || "Fonte Web",
          uri: chunk.web.uri
        });
      }
    });

    let parsedData: DashboardData = FALLBACK_DATA;
    
    try {
      let jsonString = textResponse.trim();
      if (jsonString.startsWith("```")) {
        jsonString = jsonString.replace(/^```(json)?/, "").replace(/```$/, "");
      }
      parsedData = JSON.parse(jsonString);
      if (!parsedData.events || !Array.isArray(parsedData.events)) {
        parsedData.events = FALLBACK_DATA.events;
      }
    } catch (e) {
      console.error("Erro ao fazer parse do JSON da IA:", e);
    }

    return { data: parsedData, sources };

  } catch (error) {
    console.error("Erro ao buscar dados da ETEC:", error);
    return { data: FALLBACK_DATA, sources: [] };
  }
};

export const askEtecTutor = async (currentMessage: string, history: ChatHistoryItem[] = []): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return "⚠️ Nenhuma chave de API configurada.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const chatHistory = history.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: chatHistory,
      config: {
        systemInstruction: `
          Você é o "EtecTutor", um mentor sênior especializado no Vestibulinho da ETEC.
          Seu Estilo: Didático, porém direto.
          Regras: Responda perguntas sobre matérias escolares com exemplos práticos. Mantenha respostas curtas (máx 150 palavras).
        `,
      }
    });

    const response = await chat.sendMessage({ message: currentMessage });
    return response.text || "Desculpe, não consegui processar a resposta.";

  } catch (error) {
    console.error("Erro no tutor:", error);
    return "Ops! Tive um problema de conexão. Tente novamente.";
  }
};

export const explainQuestion = async (question: string, correctAlternative: string, userAlternative: string): Promise<string> => {
   try {
    const apiKey = getApiKey();
    if (!apiKey) return "Sem API Key.";

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      Atue como um Professor da ETEC corrigindo uma prova.
      QUESTÃO: "${question}"
      GABARITO: "${correctAlternative}"
      RESPOSTA ALUNO: "${userAlternative}"
      Gere uma explicação curta (máx 100 palavras) explicando o acerto ou erro.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a explicação.";

   } catch (error) {
     console.error("Erro na explicação:", error);
     return "Erro ao conectar com o explicador.";
   }
};

export const generateExamImage = async (prompt: string): Promise<string | null> => {
  // Obtém todas as chaves embaralhadas para tentar uma por uma
  const keys = getAllKeysShuffled();
  
  if (keys.length === 0) return null;

  console.log(`Iniciando geração de imagem. Pool de chaves: ${keys.length}`);

  // Loop de Tentativas (Retry com rotação de chaves)
  for (const apiKey of keys) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Tentativa 1: Modelo Pro
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: "4:3", imageSize: "1K" } },
        });

        const imgData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (imgData) {
          return `data:image/png;base64,${imgData}`;
        }
      } catch (proError) {
         // Silencioso: tenta o Flash com a mesma chave ou passa para a próxima chave no catch externo
      }

      // Tentativa 2: Modelo Flash (mesma chave)
      try {
        const responseFlash = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: "4:3" } },
        });

        const flashData = responseFlash.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (flashData) {
          return `data:image/png;base64,${flashData}`;
        }
      } catch (flashError) {
         console.warn(`Chave ...${apiKey.slice(-4)} falhou em ambos modelos. Tentando próxima.`);
         continue; // Força próxima iteração do loop de chaves
      }

    } catch (keyError) {
       console.warn(`Erro de conexão com chave ...${apiKey.slice(-4)}. Tentando próxima.`);
       continue;
    }
  }
  
  console.error("Todas as chaves de API falharam na geração de imagem.");
  return null;
};

export const generateMockExam = async (
  subject: string = "Mix Geral", 
  count: number = 5,
  grade: string = "Todos",
  difficulty: string = "Misto",
  customTopic?: string
): Promise<Question[]> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return MOCK_EXAM_QUESTIONS.slice(0, count);

    const ai = new GoogleGenAI({ apiKey });
    
    let gradeInstruction = "Distribuição: 6º ao 9º ano.";
    if (grade !== "Todos") gradeInstruction = `Foco: Apenas conteúdo do ${grade}.`;

    let diffInstruction = "Dificuldade: Mista.";
    if (difficulty === "Fácil") diffInstruction = "Dificuldade: Fácil.";
    if (difficulty === "Médio") diffInstruction = "Dificuldade: Média.";
    if (difficulty === "Difícil") diffInstruction = "Dificuldade: Difícil.";

    let themeInstruction = `Tema: ${subject}.`;
    if (subject === "Tema Personalizado" && customTopic) {
      themeInstruction = `Tema Contextualizado: ${customTopic}. Adapte para as matérias da ETEC.`;
    }

    const prompt = `
      Crie um simulado ETEC inédito.
      Config: ${themeInstruction}, ${count} questões, ${gradeInstruction}, ${diffInstruction}.
      
      Regras:
      1. Contextualização: Use texto base ("contextText").
      2. Interdisciplinaridade.
      3. Ilustrações: 30% das questões devem ter "imagePrompt" (descrição visual em inglês).
      
      JSON Output format only (Array):
      [{
        "id": number,
        "subject": "string",
        "source": "IA",
        "contextText": "string",
        "competency": "string",
        "text": "string",
        "imagePrompt": "string or null",
        "alternatives": ["A", "B", "C", "D", "E"],
        "correctIndex": 0-4
      }]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const jsonText = response.text || "[]";
    let questions: Question[] = JSON.parse(jsonText);
    
    if (Array.isArray(questions) && questions.length > 0) {
      return questions.map((q, idx) => ({ ...q, id: idx + 1 }));
    }
    
    return MOCK_EXAM_QUESTIONS.slice(0, count);

  } catch (error) {
    console.error("Erro ao gerar simulado:", error);
    return MOCK_EXAM_QUESTIONS.slice(0, count);
  }
};

export const getWordDefinition = async (word: string, context: string): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return "Dicionário indisponível.";

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Defina "${word}" no contexto: "${context}". Máx 40 palavras.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Definição não encontrada.";
  } catch (error) {
    return "Erro ao buscar definição.";
  }
};

export const explainStudyTopic = async (topic: string, subject: string): Promise<StudyContent | null> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      Material de estudo ETEC: "${topic}" (${subject}).
      JSON Output:
      {
        "concept": "Explicação teórica (máx 150 palavras).",
        "application": "Contexto ETEC (máx 100 palavras).",
        "quiz": {
           "question": "Pergunta múltipla escolha.",
           "options": ["A", "B", "C", "D"],
           "correctIndex": 0-3
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}") as StudyContent;

  } catch (error) {
    console.error("Erro ao gerar conteúdo:", error);
    return null;
  }
};

export const askStudyTutor = async (
  topic: string, 
  subject: string, 
  question: string, 
  contextConcept: string,
  history: ChatHistoryItem[] = []
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return "Erro de conexão.";

    const ai = new GoogleGenAI({ apiKey });

    const chatHistory = history.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: chatHistory,
      config: {
        systemInstruction: `Tutor de "${topic}" (${subject}). Contexto: ${contextConcept}. Seja didático e breve.`,
      }
    });

    const response = await chat.sendMessage({ message: question });
    return response.text || "Desculpe, não entendi.";

  } catch (error) {
    return "Erro ao processar dúvida.";
  }
}

export const recommendVideoLessons = async (topic: string, subject: string): Promise<VideoRecommendation[]> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return [];

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      3 videoaulas YouTube para "${topic}" (Vestibulinho ETEC).
      JSON Array Output:
      [{ "title": "Título", "channelName": "Canal", "description": "Por que assistir" }]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "[]") as VideoRecommendation[];

  } catch (error) {
    return [];
  }
};

export const generateStudyPlan = async (hoursPerDay: number, weakness: string): Promise<StudyDay[]> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("Sem API Key");

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Cronograma Semanal ETEC. Disponibilidade: ${hoursPerDay}h/dia. Dificuldade: ${weakness}.
      JSON Array Output (7 dias):
      [{
          "dayName": "Segunda-feira",
          "focus": "Foco do dia",
          "tasks": [{ "id": "t1", "topic": "Tópico", "subject": "Matéria", "completed": false }]
      }]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erro ao gerar cronograma:", error);
    // Fallback simples
    return [
      {
        dayName: "Segunda-feira",
        focus: "Português",
        tasks: [
           { id: "f-1", topic: "Interpretação de Texto", subject: "Português", completed: false },
        ]
      }
    ];
  }
};
