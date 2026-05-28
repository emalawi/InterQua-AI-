import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API router goes here FIRST
  app.post("/api/test-key", async (req, res) => {
    const userApiKey = (req.body.apiKey || req.headers["x-gemini-key"]) as string || process.env.GEMINI_API_KEY;
    if (!userApiKey || userApiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({ error: "Missing Gemini API key. Please check your settings." });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: userApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Hello, reply back with the word 'READY' and nothing else.",
      });
      res.json({ success: true, message: response.text?.trim() });
    } catch (error: any) {
      console.error("Test key failed:", error);
      res.status(400).json({ error: error.message || "Invalid API Key or connection issue." });
    }
  });

  app.post("/api/chat-stream", async (req, res) => {
    const { message, history, model, systemInstruction } = req.body;
    const userApiKey = (req.headers["x-gemini-key"] || req.body.apiKey) as string || process.env.GEMINI_API_KEY;

    if (!userApiKey || userApiKey === "MY_GEMINI_API_KEY") {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Gemini API key is required. Please set it in Settings." }));
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    try {
      const ai = new GoogleGenAI({
        apiKey: userApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prepare contents history
      const contents = history && Array.isArray(history) 
        ? history.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          }))
        : [];

      // Add the latest prompt
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const responseStream = await ai.models.generateContentStream({
        model: model || "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction || "You are InterQua AI, a world-class coding companion. Write beautifully commented code, solve syntax issues, explain reasoning efficiently in clean markdown, and output terminal-optimized guides.",
          temperature: 0.7,
        }
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("Chat streaming error:", error);
      res.write(`data: ${JSON.stringify({ error: error.message || "Generation error" })}\n\n`);
      res.end();
    }
  });

  // Serve static assets or use Vite dev middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
