import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { streamSSE } from "hono/streaming";
import {
  createSession,
  getSession,
  GameSession,
} from "../services/sessionManager.js";
import type { Language } from "../types.js";

type SessionEnv = { Variables: { session: GameSession } };

const withSession = createMiddleware<SessionEnv>(async (c, next) => {
  const id = c.req.param("id")!;
  const session = getSession(id);
  if (!session) return c.json({ error: "Session not found" }, 404);
  c.set("session", session);
  await next();
});

const game = new Hono<SessionEnv>();

game.post("/start", async (c) => {
  const body = await c.req.json<{ language?: Language }>();
  const language = body.language || "en";

  const session = createSession(language);
  try {
    const firstQuestion = session.initialize();
    return c.json({ gameId: session.id, question: firstQuestion });
  } catch (err) {
    console.error("Failed to start game:", err);
    return c.json({ error: "Failed to start game" }, 500);
  }
});

game.use("/:id/*", withSession);

game.post("/:id/answer", async (c) => {
  const session = c.get("session");

  const body = await c.req.json<{ answer: "approve" | "reject" }>();
  if (body.answer !== "approve" && body.answer !== "reject") {
    return c.json({ error: "Invalid answer" }, 400);
  }

  try {
    const result = await session.submitAnswer(body.answer);
    return c.json(result);
  } catch (err) {
    console.error("Failed to submit answer:", err);
    return c.json({ error: "Failed to process answer" }, 500);
  }
});

game.post("/:id/serve", (c) => {
  const session = c.get("session");
  session.markQuestionServed();
  return c.json({ status: "ok" });
});

game.get("/:id/results", (c) => {
  const session = c.get("session");
  const results = session.getResults();
  return c.json(results);
});

game.get("/:id/feedback", (c) => {
  const session = c.get("session");

  return streamSSE(c, async (stream) => {
    try {
      for await (const chunk of session.streamFeedback()) {
        await stream.writeSSE({ data: chunk });
      }
      await stream.writeSSE({ event: "done", data: "" });
    } catch (err) {
      console.error("Feedback stream error:", err);
      await stream.writeSSE({ event: "error", data: "Feedback generation failed" });
    }
  });
});

export default game;
