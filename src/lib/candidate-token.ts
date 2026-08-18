import { prisma } from "@/lib/prisma"

export type TokenValidationReason = "not_found" | "already_submitted"

export interface TokenValidationSuccess {
  valid: true
  reason?: null
  candidate: {
    id: string
    fullName: string
    email: string
    jobId: string
  }
  job: {
    title: string
    requiredSkills: string[]
    experienceLevel: string
  }
}

export interface TokenValidationFailure {
  valid: false
  reason: TokenValidationReason
  candidate?: null
  job?: null
}

export type TokenValidationResult = TokenValidationSuccess | TokenValidationFailure

/**
 * Validates a candidate's magic assessment token.
 * Returns valid state, candidate data, and job title or failure reason (not_found | already_submitted).
 */
export async function validateAssessmentToken(token: string): Promise<TokenValidationResult> {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return { valid: false, reason: "not_found" }
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { assessmentToken: token },
      include: {
        job: true,
        assessmentSubmission: true,
      },
    })

    if (!candidate || !candidate.job) {
      return { valid: false, reason: "not_found" }
    }

    if (candidate.assessmentSubmission) {
      return { valid: false, reason: "already_submitted" }
    }

    return {
      valid: true,
      reason: null,
      candidate: {
        id: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        jobId: candidate.jobId,
      },
      job: {
        title: candidate.job.title,
        requiredSkills: candidate.job.requiredSkills,
        experienceLevel: candidate.job.experienceLevel,
      },
    }
  } catch (error) {
    console.error("Failed to validate assessment token:", error)
    return { valid: false, reason: "not_found" }
  }
}

/**
 * Validates a candidate's magic AI interview token.
 * Returns valid state, candidate data, and job title or failure reason (not_found | already_submitted).
 */
export async function validateInterviewToken(token: string): Promise<TokenValidationResult> {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return { valid: false, reason: "not_found" }
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { interviewToken: token },
      include: {
        job: true,
        interviewSession: true,
      },
    })

    if (!candidate || !candidate.job) {
      return { valid: false, reason: "not_found" }
    }

    const session = candidate.interviewSession
    if (session && (session.completedAt !== null || session.score !== null)) {
      return { valid: false, reason: "already_submitted" }
    }

    return {
      valid: true,
      reason: null,
      candidate: {
        id: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        jobId: candidate.jobId,
      },
      job: {
        title: candidate.job.title,
        requiredSkills: candidate.job.requiredSkills,
        experienceLevel: candidate.job.experienceLevel,
      },
    }
  } catch (error) {
    console.error("Failed to validate interview token:", error)
    return { valid: false, reason: "not_found" }
  }
}
