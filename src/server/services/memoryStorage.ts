import type { QuestionWithAnswer } from "../types.js";

export class MemoryStorage {
  private queue: QuestionWithAnswer[] = [];

  constructor(initialQuestions: QuestionWithAnswer[]) {
    this.queue = [...initialQuestions];
    this.shuffle();
  }

  addQuestions(questions: QuestionWithAnswer[]): void {
    this.queue.push(...questions);
  }

  takeNext(): QuestionWithAnswer | null {
    return this.queue.shift() ?? null;
  }

  shuffle(): void {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  remaining(): number {
    return this.queue.length;
  }
}
