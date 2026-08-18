import { prisma } from "@/lib/prisma"
import { generateTextEmbedding } from "@/lib/embeddings"
import {
  computeCosineSimilarity,
  upsertVectorPoint,
  QDRANT_COLLECTIONS,
} from "@/lib/qdrant"

export interface ResumeMatchResult {
  candidateId: string
  jobId: string
  similarity: number
  resumeScore: number
  warning?: string
}

/**
 * Executes the full Resume Matcher pipeline using OpenAI Embeddings, Qdrant Vector Storage,
 * Cosine Similarity calculation, DB score upsert, and embedding tracking metadata save.
 */
export async function runResumeMatchingPipeline(
  candidateId: string,
  jobId: string
): Promise<ResumeMatchResult> {
  const [candidate, job] = await Promise.all([
    prisma.candidate.findUnique({
      where: { id: candidateId },
    }),
    prisma.jobPosting.findUnique({
      where: { id: jobId },
    }),
  ])

  if (!candidate || !job) {
    throw new Error(`Candidate (${candidateId}) or Job (${jobId}) not found in database.`)
  }

  const hasSkills = Array.isArray(candidate.skills) && candidate.skills.length > 0
  const hasResumeText = Boolean(candidate.resumeUrl || candidate.profileUrl)

  // Edge case guard: If candidate has no skills and no resume text, assign resumeScore = 0
  if (!hasSkills && !hasResumeText) {
    console.warn(`⚠️ Candidate ${candidate.fullName} (${candidateId}) has no skills or resume text. Assigning resumeScore = 0.`)

    await prisma.candidateScore.upsert({
      where: { candidateId },
      create: { candidateId, resumeScore: 0 },
      update: { resumeScore: 0 },
    })

    return {
      candidateId,
      jobId,
      similarity: 0,
      resumeScore: 0,
      warning: "Candidate has no skills or resume text. Assigned score 0.",
    }
  }

  // 1. Generate JD Embedding & store in Qdrant
  const jdCombinedText = `Job Title: ${job.title}. Required Skills: ${job.requiredSkills.join(", ")}. Description: ${job.description}`
  const jdEmbedding = await generateTextEmbedding(jdCombinedText)

  const jobPointId = job.id
  await upsertVectorPoint(QDRANT_COLLECTIONS.JOBS, jobPointId, jdEmbedding, {
    jobId: job.id,
    title: job.title,
  })

  // 2. Generate Candidate Embedding & store in Qdrant
  const candidateCombinedText = `Candidate Name: ${candidate.fullName}. Skills: ${candidate.skills.join(", ")}. Platform: ${candidate.sourcePlatform}. Location: ${candidate.location || ""}`
  const candidateEmbedding = await generateTextEmbedding(candidateCombinedText)

  const candidatePointId = candidate.id
  await upsertVectorPoint(QDRANT_COLLECTIONS.CANDIDATES, candidatePointId, candidateEmbedding, {
    candidateId: candidate.id,
    jobId: job.id,
  })

  // 3. Compute Cosine Similarity (0.0 to 1.0)
  const rawSimilarity = computeCosineSimilarity(jdEmbedding, candidateEmbedding)
  const similarity = Math.round(rawSimilarity * 1000) / 1000

  // 4. Convert similarity to Resume Score out of 10 (rounded to 1 decimal)
  const resumeScore = Math.round(similarity * 10 * 10) / 10

  // 5. Update candidate_scores table
  await prisma.candidateScore.upsert({
    where: { candidateId },
    create: { candidateId, resumeScore },
    update: { resumeScore },
  })

  // 6. Save tracking metadata to candidate_embeddings table
  await prisma.candidateEmbedding.upsert({
    where: { candidateId },
    create: {
      candidateId,
      jobId,
      qdrantPointId: candidatePointId,
    },
    update: {
      jobId,
      qdrantPointId: candidatePointId,
    },
  })

  console.log(`✅ Resume Matcher computed — Candidate: ${candidate.fullName} | Similarity: ${similarity} | Resume Score: ${resumeScore}/10`)

  return {
    candidateId,
    jobId,
    similarity,
    resumeScore,
  }
}
