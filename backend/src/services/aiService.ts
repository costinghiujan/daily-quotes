interface OllamaEmbeddingResponse {
  embedding: number[];
}

interface OllamaGenerateResponse {
  response: string;
  done: boolean;
}

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
        throw new Error(`Ollama Embedding Error: ${response.statusText}`);
      }

      const data = (await response.json()) as OllamaEmbeddingResponse;
      return data.embedding;
      
    } catch (error) {
      console.error('[AI Service] Eroare la generarea vectorului:', error);
      return null; 
    }
  },

  generateTags: async (text: string): Promise<string[]> => {
    try {
      const response = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          prompt: `Analyze the following quote and return EXACTLY ONE highly relevant hashtag in English that represents its core theme. Output ONLY the hashtag (e.g., #motivation). Do not include any explanations, punctuation, or other text.\n\nQuote: "${text}"`,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama Tag Generation Error: ${response.statusText}`);
      }

      const data = (await response.json()) as OllamaGenerateResponse;
      
      const rawTags = data.response.trim().match(/#[a-zA-Z0-9_]+/g);
      
      if (!rawTags || rawTags.length === 0) return ['general'];

      const singleTag = rawTags[0].substring(1).toLowerCase();

      return [singleTag];

    } catch (error) {
      console.error('[AI Service] Eroare la clasificarea textului:', error);
      return ['general'];
    }
  },
};