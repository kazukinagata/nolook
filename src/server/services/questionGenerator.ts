import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Language, GeneratedQuestion } from "../types.js";
import {
  buildBatchPrompt,
  buildFeedbackPrompt,
  questionBatchSchemaObj,
} from "../prompt.js";
import type { AnswerHistoryEntry, GameResults } from "../types.js";

const BATCH_SIZE = 25;

interface GenerateOptions {
  onBatch?: (questions: GeneratedQuestion[]) => void;
  getExistingSummaries?: () => string[];
}

export async function generateQuestionsWithAgent(
  count: number,
  language: Language,
  options?: GenerateOptions
): Promise<GeneratedQuestion[]> {
  const allQuestions: GeneratedQuestion[] = [];
  const batches = Math.ceil(count / BATCH_SIZE);

  for (let i = 0; i < batches; i++) {
    const batchCount = Math.min(BATCH_SIZE, count - i * BATCH_SIZE);
    console.log(`[agent] Generating batch ${i + 1}/${batches} (${batchCount} questions)...`);

    // Collect existing summaries for dedup
    const existing = options?.getExistingSummaries?.() || [];

    try {
      const questions = await generateBatch(batchCount, language, existing);
      allQuestions.push(...questions);
      console.log(`[agent] Batch ${i + 1} done: ${questions.length} questions (total: ${allQuestions.length})`);
      if (options?.onBatch && questions.length > 0) {
        options.onBatch(questions);
      }
    } catch (err) {
      console.error(`[agent] Batch ${i + 1} failed:`, err);
    }
  }

  return allQuestions;
}

async function generateBatch(
  count: number,
  language: Language,
  existingSummaries: string[]
): Promise<GeneratedQuestion[]> {
  const prompt = buildBatchPrompt(count, language, existingSummaries);
  const schema = questionBatchSchemaObj(count);
  let structuredOutput: unknown = null;

  for await (const message of query({
    prompt,
    options: {
      model: "haiku",
      maxTurns: 5,
      tools: [],
      outputFormat: { type: "json_schema", schema },
    },
  })) {
    if ("structured_output" in (message as Record<string, unknown>) && message.type === "result") {
      structuredOutput = (message as Record<string, unknown>).structured_output;
    }
  }

  if (!structuredOutput) {
    console.error("[agent] No structured output from batch");
    return [];
  }

  return parseBatchOutput(structuredOutput, count);
}

export async function* generateFeedbackStream(
  answerHistory: AnswerHistoryEntry[],
  results: GameResults,
  language: Language
): AsyncGenerator<string> {
  const prompt = buildFeedbackPrompt(answerHistory, results, language);

  for await (const message of query({
    prompt,
    options: {
      model: "haiku",
      maxTurns: 3,
      tools: [],
    },
  })) {
    if (message.type === "stream_event") {
      const event = (message as { event: { type: string; delta?: { type: string; text?: string } } }).event;
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
        yield event.delta.text;
      }
    }
  }
}

function parseBatchOutput(data: unknown, _expectedCount: number): GeneratedQuestion[] {
  const obj = data as { questions?: GeneratedQuestion[] };
  const questions = obj.questions || (Array.isArray(data) ? (data as GeneratedQuestion[]) : null);

  if (!questions || !Array.isArray(questions)) {
    console.error("Batch output missing 'questions' array");
    return [];
  }

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

  return validated;
}
