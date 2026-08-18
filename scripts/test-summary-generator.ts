import "dotenv/config"
import { prisma } from "../src/lib/prisma"
import { generateCandidateSummary } from "../src/services/summary.service"

async function testSummaryGenerator() {
  console.log("🧪 Testing AI Summary Generator (Chunk A3)...\n")

  const candidate = await prisma.candidate.findFirst({
    orderBy: { createdAt: "desc" },
    include: { scores: true, job: true },
  })

  if (!candidate) {
    console.error("❌ No candidate found in DB.")
    process.exit(1)
  }

  console.log(`📌 Candidate: ${candidate.fullName} (${candidate.id})`)
  console.log(`📌 Job Title: ${candidate.job.title}`)
  console.log(`📊 Composite Score: ${candidate.scores?.compositeScore} / 10\n`)

  // Test case 1 — Generate summary
  console.log("1️⃣ Executing generateCandidateSummary(candidateId, true)...")
  const result = await generateCandidateSummary(candidate.id, true)

  console.log("\n========================================================")
  console.log("✅ AI SUMMARY GENERATOR VERIFICATION SUCCESSFUL!")
  console.log("--------------------------------------------------------")
  console.log(`AI Summary        : "${result.data?.aiSummary}"`)
  console.log(`Recommendation    : ${result.data?.recommendationTag}`)
  console.log(`One-Line Verdict  : "${result.data?.oneLineVerdict}"`)
  console.log(`Strengths         : ${result.data?.strengths.join(", ")}`)
  console.log(`Weaknesses        : ${result.data?.weaknesses.join(", ")}`)
  console.log("========================================================")

  // Verify DB record
  const updatedScores = await prisma.candidateScore.findUnique({
    where: { candidateId: candidate.id },
  })

  console.log("\n📊 Database Persistence Check:")
  console.log(`candidate_scores.aiSummary         = ${updatedScores?.aiSummary}`)
  console.log(`candidate_scores.recommendationTag = ${updatedScores?.recommendationTag}`)
  console.log(`candidate_scores.oneLineVerdict    = ${updatedScores?.oneLineVerdict}`)
}

testSummaryGenerator()
  .catch((err) => {
    console.error("❌ Test failed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
