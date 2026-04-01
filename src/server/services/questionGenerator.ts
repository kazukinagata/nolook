import { spawn } from "child_process";
import type {
  Category,
  Difficulty,
  Language,
  GeneratedQuestion,
} from "../types.js";
import { buildPrompt, questionJsonSchema } from "../prompt.js";
import { getNextFallback } from "../fallbackQuestions.js";

const GENERATION_TIMEOUT_MS = 15_000;

export async function generateQuestion(
  category: Category,
  difficulty: Difficulty,
  language: Language
): Promise<GeneratedQuestion> {
  try {
    const prompt = buildPrompt(category, difficulty, language);
    const result = await callClaude(prompt);
    return parseClaudeOutput(result);
  } catch (err) {
    console.error(
      `Question generation failed (${category}/${difficulty}):`,
      err
    );
    const fb = getNextFallback(category, difficulty);
    return {
      conversation: fb.conversation,
      toolName: fb.toolName,
      toolParams: fb.toolParams,
      correctAnswer: fb.correctAnswer,
      explanation: fb.explanation,
    };
  }
}

function callClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      "-p",
      "--model",
      "haiku",
      "--output-format",
      "json",
      "--json-schema",
      questionJsonSchema,
      prompt,
    ];

    const proc = spawn("claude", args, {
      timeout: GENERATION_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0 || stdout.trim()) {
        resolve(stdout);
      } else {
        reject(
          new Error(
            `claude exited with code ${code}: ${stderr || "no output"}`
          )
        );
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });

    // Kill if timeout
    setTimeout(() => {
      proc.kill("SIGTERM");
      reject(new Error("claude -p timed out"));
    }, GENERATION_TIMEOUT_MS);
  });
}

function parseClaudeOutput(raw: string): GeneratedQuestion {
  // claude --output-format json wraps result in { result: "...", ... }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Try stripping markdown fences
    const stripped = raw
      .replace(/^```json?\n?/m, "")
      .replace(/\n?```$/m, "");
    parsed = JSON.parse(stripped);
  }

  // If claude wraps in { result: "...", is_error: true }, check for errors
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "is_error" in parsed &&
    (parsed as { is_error: boolean }).is_error
  ) {
    const msg =
      (parsed as { result?: string }).result || "Unknown claude error";
    throw new Error(`claude returned error: ${msg}`);
  }

  // If claude wraps in { result: "..." }, extract the inner content
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "result" in parsed
  ) {
    const inner = (parsed as { result: string }).result;
    if (typeof inner === "string") {
      parsed = JSON.parse(inner);
    } else {
      parsed = inner;
    }
  }

  const q = parsed as GeneratedQuestion;

  // Validate required fields
  if (
    !q.conversation ||
    !q.toolName ||
    !q.toolParams ||
    !q.correctAnswer ||
    !q.explanation
  ) {
    throw new Error("Missing required fields in generated question");
  }

  if (q.correctAnswer !== "approve" && q.correctAnswer !== "reject") {
    throw new Error(
      `Invalid correctAnswer: ${q.correctAnswer}`
    );
  }

  return q;
}
