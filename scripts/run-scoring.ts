import "dotenv/config"
import { prisma } from "../src/lib/prisma"
import { runScoringPipeline } from "../src/services/orchestrator.service"

const candidateId = process.argv[2]
const jobId = process.argv[3]

async function main() {
  let targetCandidateId = candidateId
  let targetJobId = jobId

  if (!targetCandidateId || !targetJobId) {
    console.log("ℹ️ No parameters provided via CLI. Finding latest candidate in DB...")
    const candidate = await prisma.candidate.findFirst({
      orderBy: { createdAt: "desc" },
    })

    if (!candidate) {
      console.error("Usage: npm run score:candidate <candidateId> <jobId>")
      process.exit(1)
    }

    targetCandidateId = candidate.id
    targetJobId = candidate.jobId
  }

  console.log("🚀 Starting TalentFlow AI Scoring Pipeline...")
  console.log("Candidate ID:", targetCandidateId)
  console.log("Job ID      :", targetJobId, "\n")

  const result = await runScoringPipeline(targetCandidateId, targetJobId)

  console.log("\n📊 Final Result JSON:")
  console.log(JSON.stringify(result, null, 2))
}

main()
  .catch((err) => {
    console.error("💥 Pipeline crashed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
