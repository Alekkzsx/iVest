// Enums
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PLAN = 'PLAN',
  QUIZ = 'QUIZ',
  ESSAY = 'ESSAY',
  TUTOR = 'TUTOR',
}

export enum Subject {
  MATH = 'Matemática',
  PHYSICS = 'Física',
  CHEMISTRY = 'Química',
  BIOLOGY = 'Biologia',
  HISTORY = 'História',
  GEOGRAPHY = 'Geografia',
  PORTUGUESE = 'Português',
  LITERATURE = 'Literatura',
  ENGLISH = 'Inglês',
  PHILOSOPHY = 'Filosofia',
}

export enum ExamType {
  ENEM = 'ENEM',
  FUVEST = 'FUVEST',
  UNICAMP = 'UNICAMP',
  GENERIC = 'Geral',
}

// Interfaces

export interface Question {
  id: string;
  statement: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizResult {
  score: number;
  total: number;
  details: {
    questionId: string;
    correct: boolean;
    userAnswer: number;
  }[];
}

export interface EssayFeedback {
  score: number; // 0-1000
  competencies: {
    name: string;
    score: number; // 0-200
    feedback: string;
  }[];
  generalComment: string;
  strengths: string[];
  improvements: string[];
}

export interface StudyPlanDay {
  day: string;
  focus: string;
  tasks: string[];
  tips: string;
}

export interface StudyPlan {
  targetExam: string;
  weeklySchedule: StudyPlanDay[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
