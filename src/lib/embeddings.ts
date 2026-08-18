import axios from "axios"

/**
 * Deterministic fallback vector generator for testing when OpenAI API key is missing/dummy
 */
function generateFallbackEmbedding(text: string, dimensions: number = 1536): number[] {
  const vector: number[] = new Array(dimensions).fill(0)
  const cleanText = text.toLowerCase().trim()

  for (let i = 0; i < cleanText.length; i++) {
    const charCode = cleanText.charCodeAt(i)
    const idx = (charCode * (i + 1) * 31) % dimensions
    vector[idx] += 0.1
  }

  // Normalize vector to unit length
  let norm = 0
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i]
  }
  norm = Math.sqrt(norm) || 1

  for (let i = 0; i < dimensions; i++) {
    vector[i] = vector[i] / norm
  }

  return vector
}

/**
 * Generate 1536-dimensional OpenAI text embedding for input text
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  const cleanText = (text || "").trim()
  if (!cleanText) {
    return new Array(1536).fill(0)
  }

  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!openaiApiKey || openaiApiKey.includes("xxxxxxxxxxxx")) {
    return generateFallbackEmbedding(cleanText, 1536)
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/embeddings",
      {
        model: "text-embedding-3-small",
        input: cleanText,
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    )

    const embedding = response.data?.data?.[0]?.embedding
    if (Array.isArray(embedding) && embedding.length === 1536) {
      return embedding
    }
  } catch (error) {
    console.warn("⚠️ OpenAI text-embedding call failed. Using fallback vector:", error)
  }

  return generateFallbackEmbedding(cleanText, 1536)
}
