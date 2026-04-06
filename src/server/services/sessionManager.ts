import type {
  Language,
  Question,
  QuestionWithAnswer,
  AnswerResult,
  GameResults,
  AnswerHistoryEntry,
} from "../types.js";
import { TOTAL_QUESTIONS, TIME_LIMIT_MS, GRACE_PERIOD_MS } from "../types.js";
import { Scorer } from "./scorer.js";
import { MemoryStorage } from "./memoryStorage.js";
import { getStaticQuestions } from "../fallbackQuestions.js";
import { generateQuestionsWithAgent, generateFeedbackStream } from "./questionGenerator.js";

export class GameSession {
  readonly id: string;
  readonly language: Language;
  private storage: MemoryStorage;
  private currentQuestion: QuestionWithAnswer | null = null;
  private currentQuestionServedAt: number = 0;
  private questionNumber = 0;
  private scorer: Scorer;
  private lastActivity: number;
  private answerHistory: AnswerHistoryEntry[] = [];

  constructor(id: string, language: Language) {
    this.id = id;
    this.language = language;
    this.storage = new MemoryStorage(getStaticQuestions(language));
    this.scorer = new Scorer();
    this.lastActivity = Date.now();
  }

  initialize(): Question {
    // Serve first question immediately from static pool
    const firstQuestion = this.serveNextQuestion()!;
    this.currentQuestionServedAt = Date.now();

    // Fire-and-forget: generate additional questions in selected language
    this.generateAdditionalQuestions();

    return firstQuestion;
  }

  private async generateAdditionalQuestions(): Promise<void> {
    try {
      let addedCount = 0;
      console.log(`[${this.id}] Starting background generation of 50 questions (${this.language})...`);
      await generateQuestionsWithAgent(50, this.language, {
        getExistingSummaries: () => this.storage.getExistingCommandSummaries(),
        onBatch: (batch) => {
          const questions: QuestionWithAnswer[] = batch.map((g, i) => ({
            id: TOTAL_QUESTIONS + addedCount + i + 1,
            category: g.category || "safe",
            difficulty: g.difficulty || "medium",
            conversation: g.conversation,
            toolName: g.toolName,
            toolParams: g.toolParams,
            correctAnswer: g.correctAnswer,
            explanation: g.explanation,
            timeLimit: TIME_LIMIT_MS,
          }));
          this.storage.addQuestions(questions);
          addedCount += questions.length;
          console.log(`[${this.id}] Added ${questions.length} questions to pool (total added: ${addedCount})`);
        },
      });
      console.log(`[${this.id}] Background generation complete. ${addedCount} questions added.`);
    } catch (err) {
      console.error(`[${this.id}] Background generation failed:`, err);
    }
  }

  markQuestionServed(): void {
    this.currentQuestionServedAt = Date.now();
  }

  private serveNextQuestion(): Question | null {
    const question = this.storage.takeNext();
    if (!question) return null;

    this.currentQuestion = question;
    this.currentQuestion.id = this.questionNumber + 1;

    const { correctAnswer, explanation, ...q } = this.currentQuestion;
    return q;
  }

  async submitAnswer(answer: "approve" | "reject"): Promise<AnswerResult> {
    this.lastActivity = Date.now();

    if (!this.currentQuestion) {
      throw new Error("No current question");
    }

    const elapsed = Date.now() - this.currentQuestionServedAt;
    const timedOut = elapsed > TIME_LIMIT_MS + GRACE_PERIOD_MS;

    const correct = !timedOut && answer === this.currentQuestion.correctAnswer;

    this.scorer.recordAnswer(
      this.currentQuestion.category,
      this.currentQuestion.difficulty,
      correct
    );

    this.answerHistory.push({
      category: this.currentQuestion.category,
      difficulty: this.currentQuestion.difficulty,
      correct,
      userAnswer: answer,
      correctAnswer: this.currentQuestion.correctAnswer,
      toolName: this.currentQuestion.toolName,
      toolParams: this.currentQuestion.toolParams,
      conversationSummary: this.currentQuestion.conversation
        .map((m) => `${m.role}: ${m.content}`)
        .join(" → "),
    });

    const currentCorrectAnswer = this.currentQuestion.correctAnswer;
    const currentExplanation = this.currentQuestion.explanation;

    this.questionNumber++;

    let nextQuestion: Question | null = null;
    if (this.questionNumber < TOTAL_QUESTIONS) {
      nextQuestion = this.serveNextQuestion();
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

  async *streamFeedback(): AsyncGenerator<string> {
    const results = this.getResults();
    yield* generateFeedbackStream(this.answerHistory, results, this.language);
  }

  isExpired(): boolean {
    return Date.now() - this.lastActivity > 10 * 60 * 1000;
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
