import { prisma } from "@/lib/prisma"
import { runResumeMatchingPipeline } from "@/lib/resume-matcher"
import { computeCompositeScore } from "@/services/scoring.service"
import { generateCandidateSummary } from "@/services/summary.service"

export interface ScoringPipelineReport {
  candidateId: string
  steps: {
    resumeMatch: "success" | "failed" | "skipped"
    composite: "success" | "failed" | "skipped"
    summary: "success" | "failed" | "skipped"
  }
  finalScores: {
    resumeScore: number | null
    testScore: number | null
    interviewScore: number | null
    compositeScore: number | null
    tier: string | null
    aiSummary: string | null
    recommendationTag: string | null
    oneLineVerdict: string | null
  } | null
}

/**
 * Runs full candidate scoring pipeline in sequential order:
 * 1. Resume Match -> saves resumeScore
 * 2. Composite Score -> computes compositeScore + tier (only if test + interview scores exist)
 * 3. AI Summary -> generates summary fields (only if compositeScore exists)
 */
export async function runScoringPipeline(
  candidateId: string,
  jobId: string
): Promise<ScoringPipelineReport> {
  const steps: ScoringPipelineReport["steps"] = {
    resumeMatch: "skipped",
    composite: "skipped",
    summary: "skipped",
  }

  // STEP 1 — Resume Match
  try {
    await runResumeMatchingPipeline(candidateId, jobId)
    steps.resumeMatch = "success"
  } catch (err) {
    console.error("❌ Resume match failed:", err)
    steps.resumeMatch = "failed"
  }

  // STEP 2 — Composite Score
  try {
    const result = await computeCompositeScore(candidateId)
    if (result.success) {
      steps.composite = "success"
    } else {
      console.warn("⚠️ Composite skipped:", result.reason, result.missing)
      steps.composite = "skipped"
    }
  } catch (err) {
    console.error("❌ Composite failed:", err)
    steps.composite = "failed"
  }

  // STEP 3 — AI Summary (only if composite succeeded)
  if (steps.composite === "success") {
    try {
      const result = await generateCandidateSummary(candidateId, true)
      steps.summary = result.success ? "success" : "failed"
    } catch (err) {
      console.error("❌ Summary failed:", err)
      steps.summary = "failed"
    }
  } else {
    steps.summary = "skipped"
  }

  // STEP 4 — Fetch final scores & return report
  const finalScores = await prisma.candidateScore.findUnique({
    where: { candidateId },
    select: {
      resumeScore: true,
      testScore: true,
      interviewScore: true,
      compositeScore: true,
      tier: true,
      aiSummary: true,
      recommendationTag: true,
      oneLineVerdict: true,
    },
  })

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("✅ TalentFlow AI — Scoring Report")
  console.log("Candidate ID   :", candidateId)
  console.log("Steps          :", steps)
  console.log("Resume Score   :", finalScores?.resumeScore)
  console.log("Test Score     :", finalScores?.testScore)
  console.log("Interview Score:", finalScores?.interviewScore)
  console.log("Composite Score:", finalScores?.compositeScore)
  console.log("Tier           :", finalScores?.tier)
  console.log("Recommendation :", finalScores?.recommendationTag)
  console.log("Verdict        :", finalScores?.oneLineVerdict)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  return {
    candidateId,
    steps,
    finalScores: finalScores || null,
  }
}
