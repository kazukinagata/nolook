import type {
  Category,
  Difficulty,
  Language,
  Question,
  QuestionWithAnswer,
  AnswerResult,
  GameResults,
} from "../types.js";
import { TOTAL_QUESTIONS, TIME_LIMIT_MS, GRACE_PERIOD_MS } from "../types.js";
import { DifficultyEngine } from "./difficultyEngine.js";
import { Scorer } from "./scorer.js";
import { generateQuestion } from "./questionGenerator.js";

const BUFFER_SIZE = 3;

interface QueuedQuestion {
  question: QuestionWithAnswer;
  category: Category;
  difficulty: Difficulty;
}

export class GameSession {
  readonly id: string;
  readonly language: Language;
  private questionSlots: Map<number, QueuedQuestion> = new Map();
  private nextSlotIndex = 0;
  private serveIndex = 0;
  private currentQuestion: QuestionWithAnswer | null = null;
  private currentQuestionServedAt: number = 0;
  private questionNumber = 0;
  private difficultyEngine: DifficultyEngine;
  private scorer: Scorer;
  private lastActivity: number;

  constructor(id: string, language: Language) {
    this.id = id;
    this.language = language;
    this.difficultyEngine = new DifficultyEngine();
    this.scorer = new Scorer();
    this.lastActivity = Date.now();
  }

  async initialize(): Promise<Question> {
    // Generate first question serially to guarantee it's ready
    await this.generateAndEnqueue();

    // Start generating remaining buffer questions in parallel
    for (let i = 1; i < BUFFER_SIZE; i++) {
      this.generateAndEnqueue();
    }

    return this.serveNextQuestion()!;
  }

  private async generateAndEnqueue(): Promise<void> {
    // Reserve a slot before async generation to preserve order
    const slot = this.nextSlotIndex++;

    const { category, difficulty } =
      this.difficultyEngine.getNextCategoryAndDifficulty(slot);

    const generated = await generateQuestion(
      category,
      difficulty,
      this.language
    );

    const question: QuestionWithAnswer = {
      id: slot + 1,
      category,
      difficulty,
      conversation: generated.conversation,
      toolName: generated.toolName,
      toolParams: generated.toolParams,
      correctAnswer: generated.correctAnswer,
      explanation: generated.explanation,
      timeLimit: TIME_LIMIT_MS,
    };

    this.questionSlots.set(slot, { question, category, difficulty });
  }

  private serveNextQuestion(): Question | null {
    const queued = this.questionSlots.get(this.serveIndex);
    if (!queued) return null;

    this.questionSlots.delete(this.serveIndex);
    this.serveIndex++;

    this.currentQuestion = queued.question;
    this.currentQuestion.id = this.questionNumber + 1;
    this.currentQuestionServedAt = Date.now();

    // Return question without answer
    const { correctAnswer, explanation, ...question } =
      this.currentQuestion;
    return question;
  }

  submitAnswer(answer: "approve" | "reject"): AnswerResult {
    this.lastActivity = Date.now();

    if (!this.currentQuestion) {
      throw new Error("No current question");
    }

    // Check server-side timer
    const elapsed = Date.now() - this.currentQuestionServedAt;
    const timedOut = elapsed > TIME_LIMIT_MS + GRACE_PERIOD_MS;

    const correct =
      !timedOut && answer === this.currentQuestion.correctAnswer;

    // Record in engines
    this.difficultyEngine.recordAnswer(
      this.currentQuestion.category,
      correct
    );
    this.scorer.recordAnswer(
      this.currentQuestion.category,
      this.currentQuestion.difficulty,
      correct
    );

    // Save current question data before serveNextQuestion() overwrites this.currentQuestion
    const currentCorrectAnswer = this.currentQuestion.correctAnswer;
    const currentExplanation = this.currentQuestion.explanation;

    this.questionNumber++;

    // Replenish buffer
    if (this.nextSlotIndex < TOTAL_QUESTIONS) {
      this.generateAndEnqueue();
    }

    // Get next question
    const nextQuestion =
      this.questionNumber < TOTAL_QUESTIONS
        ? this.serveNextQuestion()
        : null;

    return {
      correct,
      correctAnswer: currentCorrectAnswer,
      explanation: currentExplanation,
      currentScore: this.scorer.getCurrentScore(),
      progress: {
        answered: this.questionNumber,
        total: TOTAL_QUESTIONS,
        categoryScores: this.scorer.getCategoryScores(),
      },
      nextQuestion,
    };
  }

  getResults(): GameResults {
    return this.scorer.getResults();
  }

  isExpired(): boolean {
    return Date.now() - this.lastActivity > 10 * 60 * 1000; // 10 minutes
  }

  get answered(): number {
    return this.questionNumber;
  }
}

// Session store
const sessions = new Map<string, GameSession>();

export function createSession(language: Language): GameSession {
  const id = crypto.randomUUID();
  const session = new GameSession(id, language);
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): GameSession | undefined {
  return sessions.get(id);
}

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  for (const [id, session] of sessions) {
    if (session.isExpired()) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);
