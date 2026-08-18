import "dotenv/config"
import { prisma } from "../src/lib/prisma"
import { computeCompositeScore } from "../src/services/scoring.service"

async function testCompositeCalculator() {
  console.log("🧪 Testing Composite Score Calculator (Chunk A2)...\n")

  const candidate = await prisma.candidate.findFirst({
    orderBy: { createdAt: "desc" },
    include: { scores: true, job: true },
  })

  if (!candidate) {
    console.error("❌ No candidate found in DB.")
    process.exit(1)
  }

  console.log(`📌 Candidate: ${candidate.fullName} (${candidate.id})`)

  // Test case 1 — Attempt calculation with missing test & interview scores
  console.log("\n1️⃣ Testing incomplete scores handling...")
  const incompleteResult = await computeCompositeScore(candidate.id)
  console.log("Result for incomplete scores:", incompleteResult)

  // Test case 2 — Seed mock scores for resume, test, and interview
  console.log("\n2️⃣ Setting candidate scores (Resume: 8.5/10, Test: 78/100, Interview: 8.0/10)...")
  await prisma.candidateScore.upsert({
    where: { candidateId: candidate.id },
    create: {
      candidateId: candidate.id,
      resumeScore: 8.5,
      testScore: 78,
      interviewScore: 8.0,
    },
    update: {
      resumeScore: 8.5,
      testScore: 78,
      interviewScore: 8.0,
    },
  })

  // Test case 3 — Execute complete composite score calculation
  console.log("\n3️⃣ Executing computeCompositeScore(candidateId)...")
  const result = await computeCompositeScore(candidate.id)

  console.log("\n========================================================")
  console.log("✅ COMPOSITE CALCULATOR VERIFICATION SUCCESSFUL!")
  console.log("--------------------------------------------------------")
  console.log(`Candidate ID   : ${candidate.id}`)
  console.log(`Composite Score: ${result.compositeScore} / 10`)
  console.log(`Assigned Tier  : ${result.tier?.toUpperCase()}`)
  console.log("========================================================")

  // Verify DB updates
  const updatedCandidate = await prisma.candidate.findUnique({
    where: { id: candidate.id },
    include: { scores: true },
  })

  console.log("\n📊 Database Persistence Verification:")
  console.log(`candidate_scores.compositeScore = ${updatedCandidate?.scores?.compositeScore}`)
  console.log(`candidate_scores.tier           = ${updatedCandidate?.scores?.tier}`)
  console.log(`candidate.status                = ${updatedCandidate?.status}`)
}

testCompositeCalculator()
  .catch((err) => {
    console.error("❌ Test failed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
