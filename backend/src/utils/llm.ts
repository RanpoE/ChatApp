import OpenAI from 'openai';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

// Create client only when a key exists to support dev without OpenAI
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function callModel(messages: ChatMessage[]): Promise<string> {
  if (!client) {
    // fallback for local/dev without a key
    const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
    return `You said: ${lastUser}`;
  }
  try {
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    const resp = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
    });
    return resp.choices[0]?.message?.content ?? '';
  } catch (err) {
    // Be resilient: never throw into the request pipeline
    const msg = err instanceof Error ? err.message : 'Model error';
    return `Sorry, I ran into an issue calling the model: ${msg}`;
  }
}
