export type Category =
  | "destructive"
  | "external"
  | "privilege"
  | "data_modification"
  | "safe";

export type Language = "en" | "ja" | "ko" | "zh";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Question {
  id: number;
  category: Category;
  difficulty: string;
  conversation: ChatMessage[];
  toolName: string;
  toolParams: Record<string, unknown>;
  timeLimit: number;
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

export type GamePhase = "start" | "playing" | "feedback" | "results";
