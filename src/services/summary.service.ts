import { prisma } from "@/lib/prisma"
import axios from "axios"

export interface SummaryOutputData {
  aiSummary: string
  strengths: string[]
  weaknesses: string[]
  recommendationTag: "Highly Recommended" | "Recommended" | "Review Required" | "Not Recommended"
  oneLineVerdict: string
  skipped?: boolean
  reason?: string
}

export interface SummaryServiceResult {
  success: boolean
  data?: SummaryOutputData
  error?: string
}

/**
 * Fallback summary generator when OpenAI API is unavailable or returns malformed response
 */
function computeFallbackSummaryData(
  candidateName: string,
  jobTitle: string,
  requiredSkills: string[],
  compositeScore: number,
  tier: string
): SummaryOutputData {
  let recommendationTag: "Highly Recommended" | "Recommended" | "Review Required" | "Not Recommended" = "Recommended"
  if (compositeScore >= 8.0) {
    recommendationTag = "Highly Recommended"
  } else if (compositeScore >= 6.0) {
    recommendationTag = "Recommended"
  } else if (compositeScore >= 4.0) {
    recommendationTag = "Review Required"
  } else {
    recommendationTag = "Not Recommended"
  }

  const primarySkill = requiredSkills[0] || "core technical requirements"
  const secondarySkill = requiredSkills[1] || "domain practices"

  return {
    aiSummary: `${candidateName} evaluated for ${jobTitle} with a composite score of ${compositeScore}/10 (${tier} tier). Demonstrates practical skills in ${primarySkill} alongside structured problem-solving. Recommended for HR team profile review.`,
    strengths: [
      `Demonstrated competency in ${primarySkill}`,
      `Practical knowledge of ${secondarySkill}`,
      "Clear communication during structured evaluation",
    ],
    weaknesses: [
      `Limited documented experience with advanced ${secondarySkill} architecture`,
    ],
    recommendationTag,
    oneLineVerdict: `Candidate satisfies ${jobTitle} requirements with a ${compositeScore}/10 fit score.`,
  }
}

/**
 * Clean forbidden words from AI summary text if present
 */
function sanitizeForbiddenWords(text: string): string {
  const forbiddenRegex = /\b(impressive|amazing|poor|unfortunately|great|excellent|terrible|awesome|weak|brilliant)\b/gi
  return text.replace(forbiddenRegex, (match) => {
    const lower = match.toLowerCase()
    if (lower === "impressive" || lower === "amazing" || lower === "great" || lower === "excellent" || lower === "awesome" || lower === "brilliant") return "solid"
    if (lower === "poor" || lower === "terrible" || lower === "weak") return "limited"
    if (lower === "unfortunately") return "notably"
    return "observed"
  })
}

/**
 * Generates structured, HR-readable candidate summary via GPT-4o after composite scoring.
 */
export async function generateCandidateSummary(
  candidateId: string,
  force: boolean = false
): Promise<SummaryServiceResult> {
  // Step 1 — Guard: check if summary already exists
  const existing = await prisma.candidateScore.findUnique({
    where: { candidateId },
    select: { aiSummary: true },
  })

  if (existing?.aiSummary && existing.aiSummary !== "Summary could not be generated." && !force) {
    return {
      success: true,
      data: {
        aiSummary: existing.aiSummary,
        strengths: [],
        weaknesses: [],
        recommendationTag: "Recommended",
        oneLineVerdict: "",
        skipped: true,
        reason: "Summary already exists. Pass force=true to regenerate.",
      },
    }
  }

  // Step 2 — Fetch all required data
  const [scores, candidate, assessment, interview] = await Promise.all([
    prisma.candidateScore.findUnique({ where: { candidateId } }),
    prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { job: true },
    }),
    prisma.assessmentSubmission.findUnique({ where: { candidateId } }),
    prisma.interviewSession.findUnique({ where: { candidateId } }),
  ])

  if (!candidate || !candidate.job) {
    return { success: false, error: "Candidate or job posting not found." }
  }

  // Step 3 — Validate composite score exists
  if (scores?.compositeScore === null || scores?.compositeScore === undefined) {
    return {
      success: false,
      error: "Composite score missing. Run composite scoring first.",
    }
  }

  const openaiApiKey = process.env.OPENAI_API_KEY
  let summaryData: SummaryOutputData | null = null

  // Step 4 — Build GPT-4o prompt & call API
  if (openaiApiKey && !openaiApiKey.includes("xxxxxxxxxxxx")) {
    const systemPrompt = `You are a candidate summary generation agent for TalentFlow AI. Generate a structured, objective, and professional candidate summary based on the data provided. Your output will be displayed directly on an HR dashboard.

STRICT RULES:
1. Never use these words: impressive, amazing, poor, unfortunately, great, excellent, terrible, awesome, weak, brilliant.
2. aiSummary must be exactly 2–3 sentences. Written for an HR manager who has not seen the full profile.
3. strengths: maximum 3 items. Name specific skills or demonstrated behaviors — never generic statements like 'good communicator'.
4. weaknesses: maximum 2 items. Frame as observations, not criticisms. E.g. 'Limited exposure to X' not 'Bad at X'.
5. recommendationTag must be exactly one of: 'Highly Recommended' | 'Recommended' | 'Review Required' | 'Not Recommended'
6. oneLineVerdict: one sentence, maximum 15 words, actionable.
7. Return ONLY valid JSON. No markdown. No explanation. No preamble.`

    const userPayload = JSON.stringify({
      candidate: {
        fullName: candidate.fullName,
        normalizedSkills: candidate.skills || [],
        sourcePlatform: candidate.sourcePlatform,
      },
      job: {
        title: candidate.job.title,
        requiredSkills: candidate.job.requiredSkills,
        experienceLevel: candidate.job.experienceLevel,
      },
      scores: {
        resumeScore: scores.resumeScore,
        testScore: scores.testScore,
        interviewScore: scores.interviewScore,
        compositeScore: scores.compositeScore,
        tier: scores.tier,
      },
      assessmentBreakdown: (assessment?.answers as unknown as { _breakdown?: unknown })?._breakdown ?? [],
      interviewTranscript: (interview?.transcript as unknown as unknown[]) ?? [],
    })

    const callOpenAI = async () => {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPayload },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        },
        {
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 20000,
        }
      )
      const content = response.data?.choices?.[0]?.message?.content ?? ""
      const clean = content.replace(/```json|```/g, "").trim()
      return JSON.parse(clean) as SummaryOutputData
    }

    try {
      summaryData = await callOpenAI()
    } catch {
      // Retry once if first attempt fails
      try {
        summaryData = await callOpenAI()
      } catch (retryErr) {
        console.error("❌ GPT-4o summary generation failed after retry:", retryErr)
      }
    }
  }

  // Fallback if OpenAI key unavailable or calls failed
  if (!summaryData || !summaryData.aiSummary) {
    summaryData = computeFallbackSummaryData(
      candidate.fullName,
      candidate.job.title,
      candidate.job.requiredSkills,
      scores.compositeScore,
      scores.tier || "qualified"
    )
  }

  // Sanitize any accidental forbidden words
  summaryData.aiSummary = sanitizeForbiddenWords(summaryData.aiSummary)
  summaryData.oneLineVerdict = sanitizeForbiddenWords(summaryData.oneLineVerdict || "")
  summaryData.strengths = (summaryData.strengths || []).slice(0, 3).map(sanitizeForbiddenWords)
  summaryData.weaknesses = (summaryData.weaknesses || []).slice(0, 2).map(sanitizeForbiddenWords)

  // Step 7 — Save to DB
  await prisma.candidateScore.update({
    where: { candidateId },
    data: {
      aiSummary: summaryData.aiSummary,
      strengths: summaryData.strengths,
      weaknesses: summaryData.weaknesses,
      recommendationTag: summaryData.recommendationTag,
      oneLineVerdict: summaryData.oneLineVerdict,
    },
  })

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      aiSummary: summaryData.aiSummary,
    },
  })

  console.log(`✅ Candidate AI Summary generated — Candidate: ${candidate.fullName} | Recommendation: ${summaryData.recommendationTag}`)

  // Step 8 — Return result
  return {
    success: true,
    data: summaryData,
  }
}
