var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  app.post("/api/ai-analyst", async (req, res) => {
    try {
      const { prompt, context } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "GEMINI_API_KEY is not configured in environment variables. Please configure it in Settings > Secrets."
        });
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const formattedContext = JSON.stringify(context, null, 2);
      const systemInstruction = `You are "Swift POS AI Analyst", an expert business analyst and financial advisor for a retail store or enterprise.
The user is viewing their store management dashboard, which contains real-time inventory and financial transactions.
Your goal is to provide insightful, professional, and practical advice to help them grow their sales, optimize stock, and manage expenses.

Context about the store (inventory, sales, or financials):
${formattedContext}

Guidelines:
1. Speak in Burmese (\u1019\u103C\u1014\u103A\u1019\u102C\u1018\u102C\u101E\u102C) by default, as the store owners and staff are based in Myanmar. If the user asks a question in English, you can reply in English.
2. Keep your answers clear, concise, highly professional, encouraging, and structured (use bullet points where appropriate).
3. Be highly realistic and actionable. Suggest practical steps like "promote item X because stock is high and it sells well" or "reorder item Y because stock is below the threshold".
4. Do not mention any internal programming or database details.
5. If there is no context or the context is empty, politely ask them to log more sales or products to get better insights.`;
      const modelsToTry = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
      let response = null;
      let lastError = null;
      for (const model of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: prompt || "\u1006\u102D\u102F\u1004\u103A\u101B\u1032\u1037 \u101C\u1000\u103A\u101B\u103E\u102D\u1021\u1001\u103C\u1031\u1021\u1014\u1031\u1000\u102D\u102F \u101E\u102F\u1036\u1038\u101E\u1015\u103A\u1015\u1031\u1038\u1015\u103C\u102E\u1038 \u101C\u102F\u1015\u103A\u1004\u1014\u103A\u1038\u1010\u102D\u102F\u1038\u1010\u1000\u103A\u1016\u102D\u102F\u1037 \u1021\u1000\u103C\u1036\u1015\u103C\u102F\u1001\u103B\u1000\u103A\u1010\u1001\u103B\u102D\u102F\u1037 \u1015\u1031\u1038\u1015\u102B\u1001\u1004\u103A\u1017\u103B\u102C\u104B",
            config: {
              systemInstruction,
              temperature: 0.7
            }
          });
          if (response && response.text) {
            console.log(`Successfully generated content using model: ${model}`);
            break;
          }
        } catch (err) {
          console.warn(`Model ${model} failed or is currently busy. Trying next fallback... Error:`, err.message || err);
          lastError = err;
        }
      }
      if (!response || !response.text) {
        return res.status(503).json({
          error: "\u101C\u1000\u103A\u101B\u103E\u102D\u1010\u103D\u1004\u103A AI \u1006\u102C\u1017\u102C\u1021\u102C\u1038\u101C\u102F\u1036\u1038 \u1021\u101C\u102F\u1015\u103A\u1019\u103B\u102C\u1038\u1014\u1031\u1015\u102B\u101E\u100A\u103A\u104B \u1001\u100F\u1014\u1031\u1019\u103E \u1015\u103C\u1014\u103A\u101C\u100A\u103A\u1000\u103C\u102D\u102F\u1038\u1005\u102C\u1038\u1015\u1031\u1038\u1015\u102B\u1001\u1004\u103A\u1017\u103B\u102C\u104B (All models are currently experiencing high demand. Please try again in a few moments.)",
          details: lastError?.message || String(lastError)
        });
      }
      res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "An error occurred while generating AI response." });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
