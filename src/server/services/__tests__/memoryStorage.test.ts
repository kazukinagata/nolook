import { describe, it, expect } from "vitest";
import { MemoryStorage } from "../memoryStorage.js";
import type { QuestionWithAnswer } from "../../types.js";

function makeQuestion(
  overrides: Partial<QuestionWithAnswer> = {}
): QuestionWithAnswer {
  return {
    id: 1,
    category: "safe",
    difficulty: "easy",
    conversation: [{ role: "user", content: "test" }],
    toolName: "Bash",
    toolParams: { command: "echo hello" },
    timeLimit: 60000,
    correctAnswer: "approve",
    explanation: "safe command",
    ...overrides,
  };
}

describe("MemoryStorage", () => {
  describe("constructor", () => {
    it("preserves the length of initial questions after shuffle", () => {
      const questions = Array.from({ length: 20 }, (_, i) =>
        makeQuestion({ id: i })
      );
      const storage = new MemoryStorage(questions);
      expect(storage.remaining()).toBe(20);
    });

    it("does not mutate the original array", () => {
      const questions = [makeQuestion({ id: 1 }), makeQuestion({ id: 2 })];
      const originalIds = questions.map((q) => q.id);
      new MemoryStorage(questions);
      expect(questions.map((q) => q.id)).toEqual(originalIds);
    });
  });

  describe("takeNext", () => {
    it("returns items in FIFO order from the (shuffled) queue", () => {
      // Use single item to guarantee order
      const storage = new MemoryStorage([makeQuestion({ id: 42 })]);
      const q = storage.takeNext();
      expect(q?.id).toBe(42);
    });

    it("moves taken items to served", () => {
      const storage = new MemoryStorage([
        makeQuestion({ id: 1, toolName: "Bash", toolParams: { command: "ls" } }),
      ]);
      storage.takeNext();
      // Served items appear in getExistingCommandSummaries
      expect(storage.getExistingCommandSummaries()).toContain("Bash: ls");
    });

    it("returns null when queue is empty", () => {
      const storage = new MemoryStorage([]);
      expect(storage.takeNext()).toBeNull();
    });

    it("returns null after all items consumed", () => {
      const storage = new MemoryStorage([makeQuestion()]);
      storage.takeNext();
      expect(storage.takeNext()).toBeNull();
    });

    it("decrements remaining count", () => {
      const storage = new MemoryStorage([
        makeQuestion({ id: 1 }),
        makeQuestion({ id: 2 }),
      ]);
      expect(storage.remaining()).toBe(2);
      storage.takeNext();
      expect(storage.remaining()).toBe(1);
      storage.takeNext();
      expect(storage.remaining()).toBe(0);
    });
  });

  describe("addQuestions", () => {
    it("appends questions to the queue", () => {
      const storage = new MemoryStorage([]);
      expect(storage.remaining()).toBe(0);

      storage.addQuestions([makeQuestion({ id: 10 }), makeQuestion({ id: 11 })]);
      expect(storage.remaining()).toBe(2);
    });

    it("added questions are returned by takeNext after existing ones", () => {
      const storage = new MemoryStorage([makeQuestion({ id: 1 })]);
      storage.addQuestions([makeQuestion({ id: 99 })]);

      const first = storage.takeNext();
      const second = storage.takeNext();
      // First should be the original (single item, no shuffle ambiguity)
      expect(first?.id).toBe(1);
      expect(second?.id).toBe(99);
    });
  });

  describe("remaining", () => {
    it("returns queue length", () => {
      const storage = new MemoryStorage([
        makeQuestion({ id: 1 }),
        makeQuestion({ id: 2 }),
        makeQuestion({ id: 3 }),
      ]);
      expect(storage.remaining()).toBe(3);
    });
  });

  describe("getExistingCommandSummaries", () => {
    it("extracts command for Bash tool type", () => {
      const storage = new MemoryStorage([
        makeQuestion({
          toolName: "Bash",
          toolParams: { command: "rm -rf /" },
        }),
      ]);
      expect(storage.getExistingCommandSummaries()).toEqual(["Bash: rm -rf /"]);
    });

    it("extracts file_path for Edit tool type", () => {
      const storage = new MemoryStorage([
        makeQuestion({
          toolName: "Edit",
          toolParams: { file_path: "/src/app.ts", old_string: "a", new_string: "b" },
        }),
      ]);
      expect(storage.getExistingCommandSummaries()).toEqual([
        "Edit: /src/app.ts",
      ]);
    });

    it("extracts file_path for Write tool type", () => {
      const storage = new MemoryStorage([
        makeQuestion({
          toolName: "Write",
          toolParams: { file_path: "/tmp/out.txt", content: "hello" },
        }),
      ]);
      expect(storage.getExistingCommandSummaries()).toEqual([
        "Write: /tmp/out.txt",
      ]);
    });

    it("includes both served and queued questions", () => {
      const storage = new MemoryStorage([
        makeQuestion({
          id: 1,
          toolName: "Bash",
          toolParams: { command: "echo served" },
        }),
        makeQuestion({
          id: 2,
          toolName: "Bash",
          toolParams: { command: "echo queued" },
        }),
      ]);
      storage.takeNext(); // moves first to served

      const summaries = storage.getExistingCommandSummaries();
      expect(summaries).toHaveLength(2);
      expect(summaries).toContain("Bash: echo served");
      expect(summaries).toContain("Bash: echo queued");
    });

    it("returns empty array when no questions", () => {
      const storage = new MemoryStorage([]);
      expect(storage.getExistingCommandSummaries()).toEqual([]);
    });

    it("handles missing command gracefully", () => {
      const storage = new MemoryStorage([
        makeQuestion({
          toolName: "Bash",
          toolParams: {},
        }),
      ]);
      expect(storage.getExistingCommandSummaries()).toEqual(["Bash: "]);
    });

    it("handles missing file_path gracefully", () => {
      const storage = new MemoryStorage([
        makeQuestion({
          toolName: "Edit",
          toolParams: {},
        }),
      ]);
      expect(storage.getExistingCommandSummaries()).toEqual(["Edit: "]);
    });
  });
});
