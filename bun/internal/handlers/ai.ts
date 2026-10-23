import { GoogleGenAI } from "@google/genai";
import { config } from "../config";
import { apiError } from "../http/errors";

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

export const aiRoutes = {
  "/api/ai/chat": {
    async POST(req: Request): Promise<Response> {
      let body: { prompt?: string; context?: unknown };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return apiError(400, "INVALID_JSON", "Request body must be JSON");
      }
      if (!body.prompt || typeof body.prompt !== "string") {
        return apiError(400, "VALIDATION_ERROR", "prompt is required");
      }
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `You are the Verdigris Cloud OS Autonomous AI Agent and System Copilot (VIP v2.4 Magenta Augmented). Context: ${JSON.stringify(body.context || {})}. User Request: ${body.prompt}`,
        });

        const promptLen = body.prompt.length || 10;
        const replyLen = response.text?.length || 20;
        const estimatedTokens = Math.ceil((promptLen + replyLen) / 4);
        const costCents =
          Math.round((estimatedTokens / 1000) * 0.075 * 1000) / 1000;

        return Response.json({
          reply:
            response.text ||
            "Action completed successfully in Verdigris WebOS.",
          polarUsage: {
            event: "ai_usage",
            tokens: estimatedTokens,
            costCents,
            currency: "usd",
          },
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "AI generation failed";
        return apiError(500, "AI_GENERATION_FAILED", errorMessage);
      }
    },
  },
} as const;
