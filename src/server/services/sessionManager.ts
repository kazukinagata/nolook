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
import { generateQuestionBatch } from "./questionGenerator.js";

const BATCH_SIZE = 10;

interface QueuedQuestion {
  question: QuestionWithAnswer;
  category: Category;
  difficulty: Difficulty;
}

export class GameSession {
  readonly id: string;
  readonly language: Language;
  private questionQueue: QueuedQuestion[] = [];
  private generatedCount = 0;
  private currentQuestion: QuestionWithAnswer | null = null;
  private currentQuestionServedAt: number = 0;
  private questionNumber = 0;
  private difficultyEngine: DifficultyEngine;
  private scorer: Scorer;
  private lastActivity: number;
  private batchInProgress: Promise<void> | null = null;

  constructor(id: string, language: Language) {
    this.id = id;
    this.language = language;
    this.difficultyEngine = new DifficultyEngine();
    this.scorer = new Scorer();
    this.lastActivity = Date.now();
  }

  async initialize(prefetchedQuestions?: QueuedQuestion[]): Promise<Question> {
    if (prefetchedQuestions && prefetchedQuestions.length > 0) {
      this.questionQueue.push(...prefetchedQuestions);
      this.generatedCount = prefetchedQuestions.length;

      // If we got fewer than a full batch, generate more in background
      if (this.generatedCount < TOTAL_QUESTIONS) {
        this.generateNextBatch();
      }
    } else {
      // No prefetch — generate first batch and wait for it
      await this.generateNextBatch();
    }

    const firstQuestion = this.serveNextQuestion()!;
    this.currentQuestionServedAt = Date.now();
    return firstQuestion;
  }

  markQuestionServed(): void {
    this.currentQuestionServedAt = Date.now();
  }

  private async generateNextBatch(): Promise<void> {
    if (this.generatedCount >= TOTAL_QUESTIONS) return;
    if (this.batchInProgress) return;

    const remaining = TOTAL_QUESTIONS - this.generatedCount;
    const batchSize = Math.min(BATCH_SIZE, remaining);

    // Build specs for this batch using current difficulty state
    const specs: Array<{ category: Category; difficulty: Difficulty }> = [];
    for (let i = 0; i < batchSize; i++) {
      const slotIndex = this.generatedCount + i;
      specs.push(this.difficultyEngine.getNextCategoryAndDifficulty(slotIndex));
    }

    const startIndex = this.generatedCount;
    this.generatedCount += batchSize;

    this.batchInProgress = (async () => {
      try {
        const generated = await generateQuestionBatch(specs, this.language);

        for (let i = 0; i < generated.length && i < specs.length; i++) {
          const g = generated[i];
          const s = specs[i];
          const question: QuestionWithAnswer = {
            id: startIndex + i + 1,
            category: s.category,
            difficulty: s.difficulty,
            conversation: g.conversation,
            toolName: g.toolName,
            toolParams: g.toolParams,
            correctAnswer: g.correctAnswer,
            explanation: g.explanation,
            timeLimit: TIME_LIMIT_MS,
          };
          this.questionQueue.push({ question, category: s.category, difficulty: s.difficulty });
        }

        console.log(`Batch generated: ${generated.length} questions (total queued: ${this.questionQueue.length})`);
      } catch (err) {
        console.error("Batch generation failed:", err);
        // generatedCount was already incremented, but no questions were added
        // This is ok — the next batch trigger will fill the gap
      } finally {
        this.batchInProgress = null;
      }
    })();

    await this.batchInProgress;
  }

  private serveNextQuestion(): Question | null {
    const queued = this.questionQueue.shift();
    if (!queued) return null;

    this.currentQuestion = queued.question;
    this.currentQuestion.id = this.questionNumber + 1;

    // Trigger next batch if queue is running low
    if (this.questionQueue.length <= BATCH_SIZE / 2 && this.generatedCount < TOTAL_QUESTIONS) {
      this.generateNextBatch();
    }

    // Return question without answer
    const { correctAnswer, explanation, ...question } = this.currentQuestion;
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

    // Get next question from the pre-generated queue (should be instant)
    let nextQuestion: Question | null = null;
    if (this.questionNumber < TOTAL_QUESTIONS) {
      nextQuestion = this.serveNextQuestion();

      // If queue was empty (batch not ready yet), wait for the in-progress batch
      if (!nextQuestion && this.batchInProgress) {
        await this.batchInProgress;
        nextQuestion = this.serveNextQuestion();
      }
    }

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

// Prefetch cache: stores pre-generated first batch by language
interface PrefetchEntry {
  questions: QueuedQuestion[];
  createdAt: number;
}
const prefetchCache = new Map<Language, PrefetchEntry>();
const prefetchInProgress = new Map<Language, Promise<void>>();

const PREFETCH_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function prefetchFirstBatch(language: Language): Promise<void> {
  // If already prefetching for this language, skip
  if (prefetchInProgress.has(language)) return;

  const existing = prefetchCache.get(language);
  if (existing && Date.now() - existing.createdAt < PREFETCH_TTL_MS) return;

  const engine = new DifficultyEngine();
  const specs: Array<{ category: Category; difficulty: Difficulty }> = [];
  for (let i = 0; i < BATCH_SIZE; i++) {
    specs.push(engine.getNextCategoryAndDifficulty(i));
  }

  const promise = (async () => {
    try {
      const generated = await generateQuestionBatch(specs, language);
      const questions: QueuedQuestion[] = generated.map((g, i) => ({
        question: {
          id: i + 1,
          category: specs[i].category,
          difficulty: specs[i].difficulty,
          conversation: g.conversation,
          toolName: g.toolName,
          toolParams: g.toolParams,
          correctAnswer: g.correctAnswer,
          explanation: g.explanation,
          timeLimit: TIME_LIMIT_MS,
        },
        category: specs[i].category,
        difficulty: specs[i].difficulty,
      }));
      prefetchCache.set(language, {
        questions,
        createdAt: Date.now(),
      });
      console.log(`Prefetch complete: ${questions.length} questions for ${language}`);
    } catch (err) {
      console.error("Prefetch failed:", err);
    } finally {
      prefetchInProgress.delete(language);
    }
  })();

  prefetchInProgress.set(language, promise);
  await promise;
}

function consumePrefetch(language: Language): QueuedQuestion[] | undefined {
  const entry = prefetchCache.get(language);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > PREFETCH_TTL_MS) {
    prefetchCache.delete(language);
    return undefined;
  }
  prefetchCache.delete(language);
  return entry.questions;
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

export async function getPrefetchedQuestions(language: Language): Promise<QueuedQuestion[] | undefined> {
  // If prefetch is in progress, wait for it to finish before consuming
  const inProgress = prefetchInProgress.get(language);
  if (inProgress) {
    await inProgress;
  }
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
