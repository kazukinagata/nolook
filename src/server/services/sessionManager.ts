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

  async initialize(prefetchedQuestion?: QueuedQuestion): Promise<Question> {
    if (prefetchedQuestion) {
      // Use prefetched question as slot 0 — serve immediately
      this.questionSlots.set(this.nextSlotIndex, prefetchedQuestion);
      this.nextSlotIndex++;

      // Start generating remaining buffer questions in background (don't await)
      for (let i = 1; i < BUFFER_SIZE; i++) {
        this.generateAndEnqueue();
      }
    } else {
      // No prefetch — generate all buffer questions in parallel, wait for all
      const bufferPromises: Promise<void>[] = [];
      for (let i = 0; i < BUFFER_SIZE; i++) {
        bufferPromises.push(this.generateAndEnqueue());
      }
      await Promise.all(bufferPromises);
    }

    const firstQuestion = (await this.serveNextQuestion())!;
    this.currentQuestionServedAt = Date.now();
    return firstQuestion;
  }

  markQuestionServed(): void {
    this.currentQuestionServedAt = Date.now();
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

  private async serveNextQuestion(): Promise<Question | null> {
    // Wait for the slot to be filled (generation may still be in progress)
    const maxWait = 60_000;
    const start = Date.now();
    while (
      !this.questionSlots.has(this.serveIndex) &&
      Date.now() - start < maxWait
    ) {
      await new Promise((r) => setTimeout(r, 200));
    }

    const queued = this.questionSlots.get(this.serveIndex);
    if (!queued) return null;

    this.questionSlots.delete(this.serveIndex);
    this.serveIndex++;

    this.currentQuestion = queued.question;
    this.currentQuestion.id = this.questionNumber + 1;

    // Return question without answer
    const { correctAnswer, explanation, ...question } =
      this.currentQuestion;
    return question;
  }

  async submitAnswer(answer: "approve" | "reject"): Promise<AnswerResult> {
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
        ? await this.serveNextQuestion()
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

// Prefetch cache: stores pre-generated first questions by language
interface PrefetchEntry {
  question: QueuedQuestion;
  createdAt: number;
}
const prefetchCache = new Map<Language, PrefetchEntry>();
const prefetchInProgress = new Map<Language, Promise<void>>();

const PREFETCH_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function prefetchFirstQuestion(language: Language): Promise<void> {
  // If already prefetching for this language, skip
  if (prefetchInProgress.has(language)) return;

  const existing = prefetchCache.get(language);
  if (existing && Date.now() - existing.createdAt < PREFETCH_TTL_MS) return;

  const engine = new DifficultyEngine();
  const { category, difficulty } = engine.getNextCategoryAndDifficulty(0);

  const promise = (async () => {
    try {
      const generated = await generateQuestion(category, difficulty, language);
      const question: QuestionWithAnswer = {
        id: 1,
        category,
        difficulty,
        conversation: generated.conversation,
        toolName: generated.toolName,
        toolParams: generated.toolParams,
        correctAnswer: generated.correctAnswer,
        explanation: generated.explanation,
        timeLimit: TIME_LIMIT_MS,
      };
      prefetchCache.set(language, {
        question: { question, category, difficulty },
        createdAt: Date.now(),
      });
    } catch (err) {
      console.error("Prefetch failed:", err);
    } finally {
      prefetchInProgress.delete(language);
    }
  })();

  prefetchInProgress.set(language, promise);
  await promise;
}

function consumePrefetch(language: Language): QueuedQuestion | undefined {
  const entry = prefetchCache.get(language);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > PREFETCH_TTL_MS) {
    prefetchCache.delete(language);
    return undefined;
  }
  prefetchCache.delete(language);
  return entry.question;
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

export function getPrefetchedQuestion(language: Language): QueuedQuestion | undefined {
  return consumePrefetch(language);
}

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  for (const [id, session] of sessions) {
    if (session.isExpired()) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);
