import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import game from "./routes/game.js";

const app = new Hono();

app.use("/api/*", cors());
app.route("/api/game", game);

// Serve static files in production
app.use("/*", serveStatic({ root: "./dist/client" }));

const port = 3001;
console.log(`NoLook server running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
