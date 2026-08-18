import { prisma } from "@/lib/prisma"

export interface CompositeScoreResult {
  success: boolean
  compositeScore?: number
  tier?: "strong" | "qualified" | "marginal" | "unqualified"
  reason?: string
  missing?: string[]
}

/**
 * Computes composite score only when ALL THREE component scores exist:
 * resumeScore (out of 10), testScore (out of 100), interviewScore (out of 10).
 * Assigns tier (strong >= 8.0, qualified >= 6.0, marginal >= 4.0, unqualified < 4.0).
 * Updates candidates.status to "scored" if candidate is not in a finalized state.
 */
export async function computeCompositeScore(
  candidateId: string
): Promise<CompositeScoreResult> {
  // Step 1 — Fetch scores & candidate with job scoring weights
  const scores = await prisma.candidateScore.findUnique({
    where: { candidateId },
  })

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      job: {
        include: {
          scoringWeights: true,
        },
      },
    },
  })

  if (!candidate) {
    return {
      success: false,
      reason: "candidate_not_found",
    }
  }

  // Step 2 — Check all three scores exist
  const missing: string[] = []
  if (scores?.resumeScore === null || scores?.resumeScore === undefined) {
    missing.push("resumeScore")
  }
  if (scores?.testScore === null || scores?.testScore === undefined) {
    missing.push("testScore")
  }
  if (scores?.interviewScore === null || scores?.interviewScore === undefined) {
    missing.push("interviewScore")
  }

  if (missing.length > 0) {
    return {
      success: false,
      reason: "incomplete_scores",
      missing,
    }
  }

  // Step 3 — Fetch weights (use defaults if not set)
  const weights = candidate.job.scoringWeights ?? {
    resumeWeight: 30,
    testWeight: 40,
    interviewWeight: 30,
  }

  // Step 4 — Compute composite score
  const resumeScore = scores!.resumeScore!
  const normalizedTestScore = scores!.testScore! / 10
  const interviewScore = scores!.interviewScore!

  const rawComposite =
    (resumeScore * (weights.resumeWeight / 100)) +
    (normalizedTestScore * (weights.testWeight / 100)) +
    (interviewScore * (weights.interviewWeight / 100))

  const compositeScore = Math.round(rawComposite * 100) / 100

  // Step 5 — Assign tier
  let tier: "strong" | "qualified" | "marginal" | "unqualified"
  if (compositeScore >= 8.0) {
    tier = "strong"
  } else if (compositeScore >= 6.0) {
    tier = "qualified"
  } else if (compositeScore >= 4.0) {
    tier = "marginal"
  } else {
    tier = "unqualified"
  }

  // Step 6 — Save to DB (candidate_scores & candidate)
  await prisma.candidateScore.update({
    where: { candidateId },
    data: {
      compositeScore,
      tier,
    },
  })

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      compositeScore,
    },
  })

  // Step 7 — Update candidate status to "scored" if not shortlisted, rejected, or on_hold
  const currentCandidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { status: true },
  })

  if (
    currentCandidate &&
    !["shortlisted", "rejected", "on_hold"].includes(currentCandidate.status)
  ) {
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: "scored" },
    })
  }

  console.log(`✅ Composite score computed — Candidate: ${candidate.fullName} | Composite: ${compositeScore} | Tier: ${tier}`)

  // Step 8 — Return result
  return {
    success: true,
    compositeScore,
    tier,
  }
}
