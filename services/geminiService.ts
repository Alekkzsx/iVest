import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Question, EssayFeedback, StudyPlan, ExamType, Subject } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper for JSON parsing ---
const cleanAndParseJSON = (text: string) => {
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini:", e);
    throw new Error("Invalid response format from AI");
  }
};

// --- QUIZ GENERATION ---
export const generateQuiz = async (subject: Subject, examType: ExamType, count: number = 5): Promise<Question[]> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            statement: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
          },
          required: ["id", "statement", "options", "correctIndex", "explanation"],
        },
      },
    },
    required: ["questions"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Gere ${count} questões de múltipla escolha de nível difícil sobre ${subject} focadas no estilo da prova ${examType}. As questões devem ser desafiadoras e interpretativas.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "Você é um professor especialista em vestibulares brasileiros.",
      },
    });

    const data = cleanAndParseJSON(response.text || "{}");
    return data.questions || [];
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

// --- ESSAY CORRECTION ---
export const gradeEssay = async (essayText: string, theme: string): Promise<EssayFeedback> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER },
      competencies: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
          },
          required: ["name", "score", "feedback"],
        },
      },
      generalComment: { type: Type.STRING },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["score", "competencies", "generalComment", "strengths", "improvements"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Tema: ${theme}\n\nRedação:\n${essayText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "Você é um corretor oficial do ENEM. Avalie a redação com rigor baseando-se nas 5 competências do ENEM. A nota total é a soma das competências (max 1000).",
      },
    });

    return cleanAndParseJSON(response.text || "{}");
  } catch (error) {
    console.error("Error grading essay:", error);
    throw error;
  }
};

// --- STUDY PLAN GENERATION ---
export const generateStudyPlan = async (exam: ExamType, hoursPerDay: number, weakSubjects: string[]): Promise<StudyPlan> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      targetExam: { type: Type.STRING },
      weeklySchedule: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING },
            focus: { type: Type.STRING },
            tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
            tips: { type: Type.STRING },
          },
          required: ["day", "focus", "tasks", "tips"],
        },
      },
    },
    required: ["targetExam", "weeklySchedule"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Crie um plano de estudos semanal para o vestibular ${exam}. O aluno tem ${hoursPerDay} horas por dia. As matérias de maior dificuldade são: ${weakSubjects.join(", ")}. Foque nessas matérias mas mantenha o equilíbrio.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    return cleanAndParseJSON(response.text || "{}");
  } catch (error) {
    console.error("Error generating plan:", error);
    throw error;
  }
};

// --- TUTOR CHAT ---
// Using streaming for better UX in chat
export const createTutorChat = () => {
    return ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            systemInstruction: "Você é o VestiBot, um tutor particular de ensino médio paciente, didático e encorajador. Explique conceitos complexos de forma simples, use analogias e dê exemplos. Se o aluno perguntar a resposta de uma questão, ajude-o a raciocinar, não dê a resposta direta imediatamente.",
        }
    });
};
