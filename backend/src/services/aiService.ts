export const aiService = {
  getEmbedding: async (text: string): Promise<number[] | null> => {
    try {
      const response = await fetch('http://127.0.0.1:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text',
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Eroare de la Ollama: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('[AI Service] Eroare la contactarea Ollama:', error);
      return null;
    }
  },
};
