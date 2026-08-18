import axios from "axios"

export const QDRANT_COLLECTIONS = {
  JOBS: "talentflow_jobs",
  CANDIDATES: "talentflow_candidates",
}

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333"
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || ""

const getHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (QDRANT_API_KEY) {
    headers["api-key"] = QDRANT_API_KEY
  }
  return headers
}

/**
 * Compute Cosine Similarity between two 1536-dimensional vectors
 */
export function computeCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length || vectorA.length === 0) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i]
    normA += vectorA[i] * vectorA[i]
    normB += vectorB[i] * vectorB[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0

  const similarity = dotProduct / denominator
  return Math.min(1.0, Math.max(0.0, similarity))
}

/**
 * Ensure Qdrant collection exists
 */
export async function ensureCollectionExists(collectionName: string): Promise<boolean> {
  try {
    const url = `${QDRANT_URL}/collections/${collectionName}`
    await axios.get(url, { headers: getHeaders(), timeout: 3000 })
    return true
  } catch {
    // Collection does not exist — create it
    try {
      const createUrl = `${QDRANT_URL}/collections/${collectionName}`
      await axios.put(
        createUrl,
        {
          vectors: {
            size: 1536,
            distance: "Cosine",
          },
        },
        { headers: getHeaders(), timeout: 5000 }
      )
      return true
    } catch (createErr) {
      console.warn(`⚠️ Qdrant collection setup warning for ${collectionName}:`, createErr)
      return false
    }
  }
}

/**
 * Upsert vector point to Qdrant collection
 */
export async function upsertVectorPoint(
  collectionName: string,
  pointId: string | number,
  vector: number[],
  payload: Record<string, unknown>
): Promise<boolean> {
  const collectionOk = await ensureCollectionExists(collectionName)
  if (!collectionOk) return false

  try {
    const url = `${QDRANT_URL}/collections/${collectionName}/points`
    await axios.put(
      url,
      {
        points: [
          {
            id: pointId,
            vector,
            payload,
          },
        ],
      },
      { headers: getHeaders(), timeout: 5000 }
    )
    return true
  } catch (err) {
    console.warn(`⚠️ Qdrant point upsert warning for ${collectionName}:`, err)
    return false
  }
}
