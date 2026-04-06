import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Language, GeneratedQuestion } from "../types.js";
import {
  buildBatchPrompt,
  buildFeedbackPrompt,
  questionBatchSchemaObj,
} from "../prompt.js";
import type { AnswerHistoryEntry, GameResults } from "../types.js";

export async function generateQuestionsWithAgent(
  count: number,
  language: Language
): Promise<GeneratedQuestion[]> {
  try {
    const prompt = buildBatchPrompt(count, language);
    const schema = questionBatchSchemaObj(count);
    let structuredOutput: unknown = null;

    console.log("[agent] Starting query()...");
    for await (const message of query({
      prompt,
      options: {
        model: "haiku",
        maxTurns: 5,
        tools: [],
        outputFormat: { type: "json_schema", schema },
      },
    })) {
      console.log(`[agent] message type=${message.type}${message.type === "result" ? ` subtype=${"subtype" in message ? message.subtype : "?"}` : ""}`);
      if ("result" in message && message.type === "result") {
        structuredOutput = (message as { structured_output?: unknown }).structured_output;
      }
    }
    console.log(`[agent] query() finished. structuredOutput=${structuredOutput ? "present" : "null"}`);

    if (!structuredOutput) {
      console.error("No structured output from agent");
      return [];
    }

    return parseBatchOutput(structuredOutput, count);
  } catch (err) {
    console.error(`Agent question generation failed (${count} questions):`, err);
    return [];
  }
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
