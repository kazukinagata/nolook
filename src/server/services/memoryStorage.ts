import type { QuestionWithAnswer } from "../types.js";

export class MemoryStorage {
  private queue: QuestionWithAnswer[] = [];
  private served: QuestionWithAnswer[] = [];

  constructor(initialQuestions: QuestionWithAnswer[]) {
    this.queue = [...initialQuestions];
    this.shuffle();
  }

  addQuestions(questions: QuestionWithAnswer[]): void {
    this.queue.push(...questions);
  }

  takeNext(): QuestionWithAnswer | null {
    const q = this.queue.shift() ?? null;
    if (q) this.served.push(q);
    return q;
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

  /** Returns summaries of all known questions (served + queued) for dedup */
  getExistingCommandSummaries(): string[] {
    return [...this.served, ...this.queue].map((q) => {
      const params = q.toolParams;
      if (q.toolName === "Bash") {
        const cmd =
          "command" in params && typeof params.command === "string"
            ? params.command
            : "";
        return `Bash: ${cmd}`;
      }
      const fp =
        "file_path" in params && typeof params.file_path === "string"
          ? params.file_path
          : "";
      return `${q.toolName}: ${fp}`;
    });
  }
}
