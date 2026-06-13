import OpenAI from "openai";

// OpenRouter Client
export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "dummy",
  baseURL: "https://openrouter.ai/api/v1",
});

// Groq Client
export const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy",
  baseURL: "https://api.groq.com/openai/v1",
});

// OpenAI Direct Client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy",
});

export async function chatJSON<T>(system: string, user: string): Promise<T> {
  // First try: OpenRouter
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== "dummy") {
    try {
      console.log("[LLM] Trying OpenRouter...");
      const resp = await openrouter.chat.completions.create({
        model: "openai/gpt-4o-mini",
        max_completion_tokens: 2048,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const raw = resp.choices[0]?.message?.content ?? "{}";
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error("[LLM] OpenRouter call failed:", err);
    }
  }

  // Second try: Groq
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "dummy") {
    try {
      console.log("[LLM] Trying Groq...");
      const resp = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_completion_tokens: 2048,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const raw = resp.choices[0]?.message?.content ?? "{}";
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error("[LLM] Groq call failed:", err);
    }
  }

  // Third try: Direct OpenAI
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "dummy") {
    try {
      console.log("[LLM] Trying OpenAI direct...");
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 2048,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const raw = resp.choices[0]?.message?.content ?? "{}";
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error("[LLM] OpenAI direct call failed:", err);
      throw err;
    }
  }

  throw new Error("No valid LLM API keys provided (OPENROUTER_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY must be set).");
}

export async function chatText(messages: { role: "system" | "user" | "assistant"; content: string }[]): Promise<string> {
  // First try: OpenRouter
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== "dummy") {
    try {
      console.log("[LLM Text] Trying OpenRouter...");
      const resp = await openrouter.chat.completions.create({
        model: "openai/gpt-4o-mini",
        max_completion_tokens: 2048,
        messages,
      });
      return resp.choices[0]?.message?.content ?? "";
    } catch (err) {
      console.error("[LLM Text] OpenRouter call failed:", err);
    }
  }

  // Second try: Groq
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "dummy") {
    try {
      console.log("[LLM Text] Trying Groq...");
      const resp = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_completion_tokens: 2048,
        messages,
      });
      return resp.choices[0]?.message?.content ?? "";
    } catch (err) {
      console.error("[LLM Text] Groq call failed:", err);
    }
  }

  // Third try: Direct OpenAI
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "dummy") {
    try {
      console.log("[LLM Text] Trying OpenAI direct...");
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 2048,
        messages,
      });
      return resp.choices[0]?.message?.content ?? "";
    } catch (err) {
      console.error("[LLM Text] OpenAI direct call failed:", err);
      throw err;
    }
  }

  throw new Error("No valid LLM API keys provided (OPENROUTER_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY must be set).");
}
