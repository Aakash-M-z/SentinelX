import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chatJSON<T>(system: string, user: string): Promise<T> {
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
}
