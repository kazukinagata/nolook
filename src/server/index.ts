import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { execSync } from "child_process";
import game from "./routes/game.js";

// Check claude CLI availability
try {
  execSync("claude --version", { stdio: "pipe" });
  console.log("claude CLI found");
} catch {
  console.warn(
    "WARNING: claude CLI not found. Fallback questions will be used."
  );
}

const app = new Hono();

app.use("/api/*", cors());
app.route("/api/game", game);

// Serve static files in production
app.use("/*", serveStatic({ root: "./dist/client" }));

const port = 3001;
console.log(`NoLook server running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
