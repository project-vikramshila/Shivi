export const cosineSimilarity = (a: number[], b: number[]) => {
  if (a.length !== b.length || a.length === 0) return 0;

  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const normA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const normB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
};

export const rankEmbeddings = (source: number[], candidates: Array<{ embedding: number[] }>, limit = 10) => {
  return candidates
    .map((candidate) => {
      const score = cosineSimilarity(source, candidate.embedding);
      return { candidate, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
};
