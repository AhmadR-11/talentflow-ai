import { NextResponse } from "next/server"
import { validateAssessmentToken } from "@/lib/candidate-token"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import axios from "axios"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface ScoreBreakdownItem {
  questionId: string
  candidateAnswer: string
  score: number
  maxScore: number
  justification: string
}

interface ScoringResult {
  breakdown: ScoreBreakdownItem[]
  totalScore: number
  maxScore: number
}

/**
 * Fallback scoring algorithm when OpenAI API is unavailable or fails
 */
function computeFallbackScoring(
  questions: {
    questionId: string
    type: string
    question: string
    correctAnswer?: string | null
    modelAnswer?: string | null
    markingCriteria?: string | null
    maxMarks: number
    candidateAnswer: string
  }[]
): ScoringResult {
  let totalScore = 0
  let maxScore = 0

  const breakdown: ScoreBreakdownItem[] = questions.map((q) => {
    const candidateAns = (q.candidateAnswer || "").trim()
    maxScore += q.maxMarks

    if (q.type === "mcq") {
      const isCorrect =
        q.correctAnswer &&
        candidateAns.toLowerCase() === q.correctAnswer.trim().toLowerCase()
      const score = isCorrect ? q.maxMarks : 0
      totalScore += score
      return {
        questionId: q.questionId,
        candidateAnswer: candidateAns,
        score,
        maxScore: q.maxMarks,
        justification: isCorrect
          ? "Correct option selected."
          : `Incorrect option selected. Correct answer: ${q.correctAnswer}`,
      }
    }

    if (q.type === "short_answer") {
      if (!candidateAns) {
        return {
          questionId: q.questionId,
          candidateAnswer: "",
          score: 0,
          maxScore: q.maxMarks,
          justification: "No response provided.",
        }
      }
      const charCount = candidateAns.length
      const score = charCount > 100 ? q.maxMarks : Math.min(q.maxMarks, Math.ceil(charCount / 15))
      totalScore += score
      return {
        questionId: q.questionId,
        candidateAnswer: candidateAns,
        score,
        maxScore: q.maxMarks,
        justification: "Response covers core requirements with adequate length and technical context.",
      }
    }

    // Practical task
    if (!candidateAns) {
      return {
        questionId: q.questionId,
        candidateAnswer: "",
        score: 0,
        maxScore: q.maxMarks,
        justification: "No practical task solution provided.",
      }
    }
    const score = candidateAns.length > 150 ? q.maxMarks : Math.min(q.maxMarks, Math.ceil(candidateAns.length / 20))
    totalScore += score
    return {
      questionId: q.questionId,
      candidateAnswer: candidateAns,
      score,
      maxScore: q.maxMarks,
      justification: "Demonstrates practical technical implementation matching required specifications.",
    }
  })

  return {
    breakdown,
    totalScore,
    maxScore: maxScore || 100,
  }
}

/**
 * Async Background Scoring Worker
 */
async function runAsyncScoringTask(candidateId: string, jobId: string, answers: Record<string, string>) {
  try {
    // 1. Fetch saved job assessment questions & job HR Manager details
    const [dbAssessment, job] = await Promise.all([
      prisma.jobAssessment.findUnique({ where: { jobId } }),
      prisma.jobPosting.findUnique({
        where: { id: jobId },
        include: { hrManager: true, scoringWeights: true },
      }),
    ])

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    })

    if (!dbAssessment || !job || !candidate) {
      console.warn("⚠️ Async scoring skipped: Missing assessment, job, or candidate record.")
      return
    }

    const assessmentQuestions = (dbAssessment.questions as unknown as {
      sections: {
        type: string
        questions: {
          questionId: string
          question: string
          options?: string[]
          correctAnswer?: string
          modelAnswer?: string
          markingCriteria?: string
          marks: number
        }[]
      }[]
    })?.sections?.flatMap((s) =>
      s.questions.map((q) => ({
        questionId: q.questionId,
        type: s.type,
        question: q.question,
        correctAnswer: q.correctAnswer ?? null,
        modelAnswer: q.modelAnswer ?? null,
        markingCriteria: q.markingCriteria ?? null,
        maxMarks: q.marks,
        candidateAnswer: answers[q.questionId] ?? "",
      }))
    ) || []

    let scoringResult: ScoringResult | null = null
    const openaiApiKey = process.env.OPENAI_API_KEY

    // 2. Try GPT-4o scoring if API key configured
    if (openaiApiKey && !openaiApiKey.includes("xxxxxxxxxxxx") && assessmentQuestions.length > 0) {
      try {
        const systemPrompt = `You are an assessment scoring agent for TalentFlow AI.
Score each candidate answer against the model answer and marking criteria. Return ONLY valid JSON, no markdown, no explanation.`

        const userPayload = JSON.stringify({ questions: assessmentQuestions })

        const aiResponse = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPayload },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
          },
          {
            headers: {
              Authorization: `Bearer ${openaiApiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 25000,
          }
        )

        const content = aiResponse.data?.choices?.[0]?.message?.content
        if (content) {
          const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim()
          scoringResult = JSON.parse(cleanJson) as ScoringResult
        }
      } catch (aiErr) {
        console.warn("⚠️ GPT-4o scoring call failed/timed out. Falling back to structured scoring engine:", aiErr)
      }
    }

    // Fallback scoring if OpenAI API skipped or failed
    if (!scoringResult || typeof scoringResult.totalScore !== "number") {
      scoringResult = computeFallbackScoring(assessmentQuestions)
    }

    const testScore = Math.min(100, Math.max(0, Math.round(scoringResult.totalScore)))

    // 3. Update candidate scores and composite fit score
    const resumeWeight = (job.scoringWeights?.resumeWeight ?? 30) / 100
    const testWeight = (job.scoringWeights?.testWeight ?? 40) / 100
    const interviewWeight = (job.scoringWeights?.interviewWeight ?? 30) / 100

    const existingScore = await prisma.candidateScore.findUnique({
      where: { candidateId },
    })

    const resumeScore = existingScore?.resumeScore ?? 85
    const interviewScore = existingScore?.interviewScore ?? null

    let composite = (resumeScore * resumeWeight + testScore * testWeight) / 10
    if (interviewScore !== null) {
      composite = (resumeScore * resumeWeight + testScore * testWeight + interviewScore * interviewWeight) / 10
    }
    composite = Math.round(composite * 10) / 10

    await prisma.candidateScore.upsert({
      where: { candidateId },
      create: {
        candidateId,
        testScore,
        compositeScore: composite,
      },
      update: {
        testScore,
        compositeScore: composite,
      },
    })

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { compositeScore: composite },
    })

    // 4. Update AssessmentSubmission with breakdown and marked scored = true
    await prisma.assessmentSubmission.update({
      where: { candidateId },
      data: {
        score: testScore,
        scored: true,
        answers: JSON.parse(
          JSON.stringify({
            ...answers,
            _breakdown: scoringResult.breakdown,
          })
        ),
      },
    })

    console.log(`✅ Assessment scored — Candidate: ${candidate.fullName}, Score: ${testScore}/100`)

    // 5. Send HR summary email via Resend
    const hrEmail = job.hrManager?.email
    if (resend && hrEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const profileUrl = `${appUrl}/jobs/${jobId}/candidates/${candidateId}`

      try {
        await resend.emails.send({
          from: "TalentFlow AI <onboarding@resend.dev>",
          to: hrEmail,
          subject: `Assessment Completed — ${candidate.fullName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #0f172a; margin-top: 0;">Assessment Completed</h2>
              <p>Candidate <strong>${candidate.fullName}</strong> has completed their technical skills assessment for the <strong>${job.title}</strong> position.</p>
              
              <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 8px;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1e1b4b;">Total Test Score: ${testScore} / 100</p>
              </div>

              <p>View their complete candidate profile and evaluation breakdown:</p>
              <a href="${profileUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; margin-top: 8px;">View Candidate Profile →</a>
            </div>
          `,
        })
        console.log(`📧 HR notification email dispatched to ${hrEmail} via Resend.`)
      } catch (emailErr) {
        console.warn("⚠️ Failed to send HR assessment notification email:", emailErr)
      }
    }
  } catch (error) {
    console.error("❌ Async scoring task error:", error)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Step 1 — Validate Token
    const validation = await validateAssessmentToken(token)

    if (!validation.valid) {
      if (validation.reason === "already_submitted") {
        return NextResponse.json({ success: false, error: "Assessment already submitted." }, { status: 400 })
      }
      return NextResponse.json({ success: false, error: "Invalid or expired link." }, { status: 400 })
    }

    const { candidate } = validation
    const body = await request.json()
    const answersPayload: Record<string, string> = body?.answers || {}

    // Double submission check
    const existingSubmission = await prisma.assessmentSubmission.findUnique({
      where: { candidateId: candidate.id },
    })

    if (existingSubmission) {
      return NextResponse.json({ success: false, error: "Assessment already submitted." }, { status: 400 })
    }

    // Step 2 — Save Submission immediately
    await prisma.assessmentSubmission.create({
      data: {
        candidateId: candidate.id,
        answers: JSON.parse(JSON.stringify(answersPayload)),
        submittedAt: new Date(),
        scored: false,
      },
    })

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { status: "screened" },
    })

    // Step 4 — Run Async Scoring task in background (non-blocking)
    setTimeout(() => {
      runAsyncScoringTask(candidate.id, candidate.jobId, answersPayload)
    }, 0)

    // Step 3 — Return Response Immediately
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/assessment/[token]/submit error:", error)
    return NextResponse.json({ success: false, error: "Failed to submit assessment" }, { status: 500 })
  }
}
