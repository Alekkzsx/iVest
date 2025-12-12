
import { Question } from "../data/mockData";

export type NavItem = "dashboard" | "cronograma" | "materias" | "simulados" | "desempenho";

export interface UserProfile {
  name: string;
  targetCourse: string; // Ex: "Desenvolvimento de Sistemas"
  xp: number;
  level: number;
  streakDays: number;
}

export interface EtecEvent {
  date: string; // Ex: "15 Out" ou "2024-10-15"
  title: string;
  type: "deadline" | "exam" | "result" | "info";
}

export interface DashboardData {
  examDate: string | null; // ISO String YYYY-MM-DD
  events: EtecEvent[];
  tipOfTheDay: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface PastExam {
  id: string;
  date: string; // ISO String
  subject: string;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  questions: Question[];
  userAnswers: number[];
}

export interface StudyTask {
  id: string;
  topic: string;
  subject: string;
  completed: boolean;
}

export interface StudyDay {
  dayName: string; // "Segunda", "Terça"...
  focus: string; // "Matemática e Física"
  tasks: StudyTask[];
}

export interface StudyPlan {
  id: string;
  createdAt: number;
  dailyHours: number;
  weakness: string;
  days: StudyDay[];
}
