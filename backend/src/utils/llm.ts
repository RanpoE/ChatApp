const openai = null;

export async function callModel(messages: { role: 'system'|'user'|'assistant'; content: string }[]) {
  if (!openai) {
    // fallback for local/dev without a key
    const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
    return `You said: ${lastUser}`;
  }
//   const resp = await openai.chat.completions.create({
//     model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
//     messages
//   });
//   return resp.choices[0]?.message?.content ?? '';
}