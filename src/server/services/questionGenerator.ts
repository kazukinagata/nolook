import { spawn } from "child_process";
import type {
  Category,
  Difficulty,
  Language,
  GeneratedQuestion,
} from "../types.js";
import { buildPrompt, buildBatchPrompt, questionJsonSchema, questionBatchJsonSchema } from "../prompt.js";
import { getNextFallback } from "../fallbackQuestions.js";

const SINGLE_TIMEOUT_MS = 45_000;
const BATCH_TIMEOUT_MS = 180_000;

export async function generateQuestion(
  category: Category,
  difficulty: Difficulty,
  language: Language
): Promise<GeneratedQuestion> {
  try {
    const prompt = buildPrompt(category, difficulty, language);
    const result = await callClaude(prompt, questionJsonSchema, SINGLE_TIMEOUT_MS);
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

export async function generateQuestionBatch(
  specs: Array<{ category: Category; difficulty: Difficulty }>,
  language: Language
): Promise<GeneratedQuestion[]> {
  try {
    const prompt = buildBatchPrompt(specs, language);
    const schema = questionBatchJsonSchema(specs.length);
    const result = await callClaude(prompt, schema, BATCH_TIMEOUT_MS);
    const parsed = parseBatchClaudeOutput(result, specs.length);
    return parsed;
  } catch (err) {
    console.error(
      `Batch question generation failed (${specs.length} questions):`,
      err
    );
    // Fall back to individual fallback questions
    return specs.map((s) => {
      const fb = getNextFallback(s.category, s.difficulty);
      return {
        conversation: fb.conversation,
        toolName: fb.toolName,
        toolParams: fb.toolParams,
        correctAnswer: fb.correctAnswer,
        explanation: fb.explanation,
      };
    });
  }
}

function callClaude(prompt: string, schema: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      "-p",
      "--model",
      "haiku",
      "--output-format",
      "json",
      "--no-session-persistence",
      "--disable-slash-commands",
      "--effort",
      "low",
      "--json-schema",
      schema,
      prompt,
    ];

    const proc = spawn("claude", args, {
      timeout: timeoutMs,
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
    }, timeoutMs);
  });
}

function extractStructuredOutput(raw: string): unknown {
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

  // Extract question data from claude's response wrapper
  if (typeof parsed === "object" && parsed !== null) {
    const wrapper = parsed as Record<string, unknown>;
    // --json-schema puts structured data in structured_output
    if ("structured_output" in wrapper && wrapper.structured_output) {
      return wrapper.structured_output;
    } else if ("result" in wrapper) {
      const inner = wrapper.result;
      if (typeof inner === "string") {
        return JSON.parse(inner);
      } else {
        return inner;
      }
    }
  }

  return parsed;
}

function parseClaudeOutput(raw: string): GeneratedQuestion {
  const q = extractStructuredOutput(raw) as GeneratedQuestion;

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

function parseBatchClaudeOutput(raw: string, _expectedCount: number): GeneratedQuestion[] {
  const data = extractStructuredOutput(raw) as { questions?: GeneratedQuestion[] };

  const questions = data.questions || (Array.isArray(data) ? data as GeneratedQuestion[] : null);
  if (!questions || !Array.isArray(questions)) {
    throw new Error("Batch output missing 'questions' array");
  }

  // Validate each question
  const validated: GeneratedQuestion[] = [];
  for (const q of questions) {
    if (
      !q.conversation ||
      !q.toolName ||
      !q.toolParams ||
      !q.correctAnswer ||
      !q.explanation
    ) {
      console.warn("Skipping invalid question in batch");
      continue;
    }
    if (q.correctAnswer !== "approve" && q.correctAnswer !== "reject") {
      console.warn(`Skipping question with invalid correctAnswer: ${q.correctAnswer}`);
      continue;
    }
    validated.push(q);
  }

  if (validated.length === 0) {
    throw new Error("No valid questions in batch output");
  }

  return validated;
}
