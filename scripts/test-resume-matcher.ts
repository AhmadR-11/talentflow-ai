import "dotenv/config"
import { prisma } from "../src/lib/prisma"
import { runResumeMatchingPipeline } from "../src/lib/resume-matcher"

async function testResumeMatcher() {
  console.log("🔍 Testing Resume Matcher Pipeline (Chunk A1)...\n")

  // Find latest candidate and job
  const candidate = await prisma.candidate.findFirst({
    orderBy: { createdAt: "desc" },
    include: { job: true, scores: true },
  })

  if (!candidate) {
    console.error("❌ No candidate found in DB. Please run `npm run seed:candidate` first.")
    process.exit(1)
  }

  console.log(`📌 Candidate: ${candidate.fullName} (ID: ${candidate.id})`)
  console.log(`📌 Job Title: ${candidate.job.title} (ID: ${candidate.job.id})`)
  console.log(`🛠️ Candidate Skills: ${candidate.skills.join(", ")}`)
  console.log(`🛠️ Job Skills: ${candidate.job.requiredSkills.join(", ")}\n`)

  console.log("🚀 Executing POST /api/scoring/resume-match matching pipeline...")
  const result = await runResumeMatchingPipeline(candidate.id, candidate.jobId)

  console.log("\n========================================================")
  console.log("✅ RESUME MATCHER VERIFICATION COMPLETED SUCCESSFULLY!")
  console.log("--------------------------------------------------------")
  console.log(`Candidate ID   : ${result.candidateId}`)
  console.log(`Job ID         : ${result.jobId}`)
  console.log(`Similarity     : ${result.similarity} (Range: 0.0 - 1.0)`)
  console.log(`Resume Score   : ${result.resumeScore} / 10`)
  console.log("========================================================")

  // Verify DB record
  const updatedScores = await prisma.candidateScore.findUnique({
    where: { candidateId: candidate.id },
  })
  const embeddingRecord = await prisma.candidateEmbedding.findUnique({
    where: { candidateId: candidate.id },
  })

  console.log("\n📊 Database Persistence Check:")
  console.log(`candidate_scores.resumeScore = ${updatedScores?.resumeScore}`)
  console.log(`candidate_embeddings.qdrantPointId = ${embeddingRecord?.qdrantPointId}`)
}

testResumeMatcher()
  .catch((err) => {
    console.error("❌ Test failed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
