export type Category =
  | "destructive"
  | "external"
  | "privilege"
  | "data_modification"
  | "safe";

export type Difficulty = "easy" | "medium" | "hard";

export type Language = "en" | "ja" | "ko" | "zh";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Question {
  id: number;
  category: Category;
  difficulty: Difficulty;
  conversation: ChatMessage[];
  toolName: string;
  toolParams: Record<string, unknown>;
  timeLimit: number;
}

export interface QuestionWithAnswer extends Question {
  correctAnswer: "approve" | "reject";
  explanation: string;
}

export interface AnswerResult {
  correct: boolean;
  correctAnswer: "approve" | "reject";
  explanation: string;
  currentScore: number;
  progress: {
    answered: number;
    total: number;
    categoryScores: Record<Category, { correct: number; total: number }>;
  };
  nextQuestion: Question | null;
}

export interface GameResults {
  score: number;
  rank: string;
  radarData: { category: string; label: string; accuracy: number }[];
  categoryBreakdown: Record<
    Category,
    { correct: number; total: number; accuracy: number }
  >;
  totalCorrect: number;
  totalQuestions: number;
  avgDifficulty: number;
}

export interface GeneratedQuestion {
  conversation: ChatMessage[];
  toolName: string;
  toolParams: Record<string, unknown>;
  correctAnswer: "approve" | "reject";
  explanation: string;
}

export const CATEGORIES: Category[] = [
  "destructive",
  "external",
  "privilege",
  "data_modification",
  "safe",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  destructive: "Destructive Ops",
  external: "External Comms",
  privilege: "Privilege / Auth",
  data_modification: "Data Modification",
  safe: "Safe Operations",
};

export const TOTAL_QUESTIONS = 50;
export const TIME_LIMIT_MS = 60_000;
export const GRACE_PERIOD_MS = 2_000;
