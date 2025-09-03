// quick heuristic: ~4 chars/token for English text
export function estimateTokens(s: string) {
  return Math.max(1, Math.ceil(s.length / 4));
}
