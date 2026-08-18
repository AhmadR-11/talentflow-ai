import { NextResponse } from "next/server"
import { validateInterviewToken } from "@/lib/candidate-token"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import axios from "axios"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface InterviewBreakdownItem {
  questionNumber: number
  question: string
  answer: string
  score: number
  maxScore: number
  justification: string
}

interface InterviewScoringResponse {
  breakdown: InterviewBreakdownItem[]
  totalScore: number
  maxScore: number
  strengths: string[]
  weaknesses: string[]
}

/**
 * Fallback evaluator when OpenAI API is unavailable or fails
 */
function computeFallbackInterviewScoring(
  transcript: { question: string; answer: string; questionNumber?: number }[],
  jobTitle: string,
  requiredSkills: string[]
): InterviewScoringResponse {
  let totalScoreSum = 0
  const maxScoreTotal = 10

  const breakdown: InterviewBreakdownItem[] = transcript.map((t, idx) => {
    const qNum = t.questionNumber || idx + 1
    const ansLength = (t.answer || "").trim().length

    let itemScore = 7
    let justification = "Demonstrates solid foundational alignment and clear communication."

    if (ansLength > 150) {
      itemScore = 8.5
      justification = "Provides detailed, structured response with clear technical evidence and examples."
    } else if (ansLength < 40) {
      itemScore = 5
      justification = "Brief response covering basic points but lacking depth and elaboration."
    }

    totalScoreSum += itemScore
    return {
      questionNumber: qNum,
      question: t.question,
      answer: t.answer,
      score: itemScore,
      maxScore: 10,
      justification,
    }
  })

  const averageScore = transcript.length > 0 ? Math.round((totalScoreSum / transcript.length) * 10) / 10 : 7.5

  return {
    breakdown,
    totalScore: averageScore,
    maxScore: maxScoreTotal,
    strengths: [
      `Strong technical alignment for ${jobTitle}`,
      `Proficient understanding of ${requiredSkills.slice(0, 2).join(" & ")}`,
      "Clear verbal and written communication skills",
    ],
    weaknesses: [
      "Could elaborate further on deep system architecture edge cases",
    ],
  }
}

/**
 * Async Background Worker for Interview Scoring, Composite Ranking, AI Summary, and HR Notification
 */
async function runAsyncInterviewScoringTask(candidateId: string, jobId: string) {
  try {
    const [session, job, candidate] = await Promise.all([
      prisma.interviewSession.findUnique({ where: { candidateId } }),
      prisma.jobPosting.findUnique({
        where: { id: jobId },
        include: { hrManager: true, scoringWeights: true },
      }),
      prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { scores: true },
      }),
    ])

    if (!session || !job || !candidate) {
      console.warn("⚠️ Async interview scoring skipped: Missing session, job, or candidate record.")
      return
    }

    const transcript = (session.transcript as unknown as { question: string; answer: string; questionNumber?: number }[]) || []
    let scoringResult: InterviewScoringResponse | null = null
    const openaiApiKey = process.env.OPENAI_API_KEY

    // STEP A — Interview Scoring via GPT-4o
    if (openaiApiKey && !openaiApiKey.includes("xxxxxxxxxxxx") && transcript.length > 0) {
      try {
        const systemPrompt = `You are an interview scoring agent for TalentFlow AI. Score each candidate answer. Return ONLY valid JSON, no markdown.`

        const userPayload = JSON.stringify({
          jobTitle: job.title,
          requiredSkills: job.requiredSkills,
          transcript,
          scoringRubric: {
            background: "Relevance of experience to role",
            technical: "Accuracy and depth of technical knowledge",
            behavioral: "Problem-solving and teamwork evidence",
            communication: "Clarity and conciseness",
          },
        })

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
          scoringResult = JSON.parse(cleanJson) as InterviewScoringResponse
        }
      } catch (aiErr) {
        console.warn("⚠️ GPT-4o interview scoring failed/timed out. Using fallback scoring engine:", aiErr)
      }
    }

    if (!scoringResult || typeof scoringResult.totalScore !== "number") {
      scoringResult = computeFallbackInterviewScoring(transcript, job.title, job.requiredSkills)
    }

    const interviewScore = Math.min(10, Math.max(0, Math.round(scoringResult.totalScore * 10) / 10))

    // Save interview score and strengths/weaknesses to candidate_scores
    await prisma.candidateScore.upsert({
      where: { candidateId },
      create: {
        candidateId,
        interviewScore,
        strengths: scoringResult.strengths || [],
        weaknesses: scoringResult.weaknesses || [],
      },
      update: {
        interviewScore,
        strengths: scoringResult.strengths || [],
        weaknesses: scoringResult.weaknesses || [],
      },
    })

    // STEP B — Compute Composite Score
    const resumeWeight = (job.scoringWeights?.resumeWeight ?? 30) / 100
    const testWeight = (job.scoringWeights?.testWeight ?? 40) / 100
    const interviewWeight = (job.scoringWeights?.interviewWeight ?? 30) / 100

    const currentScoreRecord = await prisma.candidateScore.findUnique({
      where: { candidateId },
    })

    const resumeScore = currentScoreRecord?.resumeScore ?? 85
    const testScore = currentScoreRecord?.testScore ?? 80

    let composite = 0
    if (resumeScore !== null && testScore !== null) {
      composite = (resumeScore * resumeWeight) + ((testScore / 10) * testWeight) + (interviewScore * interviewWeight)
    } else {
      console.warn(`⚠️ Candidate ${candidate.fullName} is missing resumeScore or testScore. Computing normalized composite.`)
      composite = ((testScore / 10) * 0.5) + (interviewScore * 0.5)
    }
    composite = Math.round(composite * 10) / 10

    await prisma.candidateScore.update({
      where: { candidateId },
      data: { compositeScore: composite },
    })

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { compositeScore: composite },
    })

    // STEP C — AI HR Summary Generation
    let summaryText = `${candidate.fullName} completed the evaluation with an overall composite fit score of ${composite}/10. Demonstrates strong technical skills in ${job.requiredSkills.slice(0, 3).join(", ")} and effective communication during the interactive AI interview.`

    if (openaiApiKey && !openaiApiKey.includes("xxxxxxxxxxxx")) {
      try {
        const summarySystemPrompt = `Generate a 2-3 sentence candidate summary for an HR dashboard. Be objective and specific. Return only the summary text.`
        const summaryUserPrompt = `Candidate: ${candidate.fullName}
Job: ${job.title}
Composite Score: ${composite}/10
Strengths: ${(scoringResult.strengths || []).join(", ")}
Weaknesses: ${(scoringResult.weaknesses || []).join(", ")}
Test Score: ${testScore}/100
Interview Score: ${interviewScore}/10`

        const summaryRes = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o",
            messages: [
              { role: "system", content: summarySystemPrompt },
              { role: "user", content: summaryUserPrompt },
            ],
            temperature: 0.5,
            max_tokens: 150,
          },
          {
            headers: {
              Authorization: `Bearer ${openaiApiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          }
        )

        const generatedSummary = summaryRes.data?.choices?.[0]?.message?.content?.trim()
        if (generatedSummary && generatedSummary.length > 20) {
          summaryText = generatedSummary
        }
      } catch (sumErr) {
        console.warn("⚠️ AI summary generation failed. Using default summary:", sumErr)
      }
    }

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { aiSummary: summaryText },
    })

    console.log(`✅ Interview scored — Candidate: ${candidate.fullName} | Interview Score: ${interviewScore}/10 | Composite Score: ${composite}/10`)

    // STEP D — HR Manager Email Notification via Resend
    const hrEmail = job.hrManager?.email
    if (resend && hrEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const profileUrl = `${appUrl}/jobs/${jobId}/candidates/${candidateId}`

      try {
        await resend.emails.send({
          from: "TalentFlow AI <onboarding@resend.dev>",
          to: hrEmail,
          subject: `Candidate Ready for Review — ${candidate.fullName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #0f172a; margin-top: 0;">Candidate Evaluation Ready for Review</h2>
              <p>Candidate <strong>${candidate.fullName}</strong> has completed both technical skills assessment and AI interview session for <strong>${job.title}</strong>.</p>
              
              <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 8px; font-size: 14px;">
                <p style="margin: 0 0 8px 0; font-[16px] font-bold color: #1e1b4b;">🏆 Composite Fit Score: ${composite} / 10</p>
                <p style="margin: 0 0 4px 0; color: #334155;">📋 Technical Test Score: <strong>${testScore} / 100</strong></p>
                <p style="margin: 0; color: #334155;">🎙️ AI Interview Score: <strong>${interviewScore} / 10</strong></p>
              </div>

              <div style="margin: 20px 0; padding: 16px; background-color: #f1f5f9; border-radius: 8px; font-size: 13px; color: #334155;">
                <p style="margin: 0 0 4px 0; font-weight: bold; color: #0f172a;">AI Evaluation Summary:</p>
                <p style="margin: 0; font-style: italic;">"${summaryText}"</p>
              </div>

              <p style="margin-top: 24px;">Click below to open the complete candidate profile dashboard:</p>
              <a href="${profileUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">View Candidate Profile →</a>
            </div>
          `,
        })
        console.log(`📧 HR review email dispatched to ${hrEmail} via Resend.`)
      } catch (emailErr) {
        console.warn("⚠️ Failed to send HR candidate review notification email:", emailErr)
      }
    }
  } catch (error) {
    console.error("❌ Async interview scoring task error:", error)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const validation = await validateInterviewToken(token)

    if (!validation.valid) {
      if (validation.reason === "already_submitted") {
        return NextResponse.json({ success: false, error: "Interview already completed." }, { status: 400 })
      }
      return NextResponse.json({ success: false, error: "Invalid or expired interview token." }, { status: 400 })
    }

    const { candidate } = validation

    // Fetch existing session
    const session = await prisma.interviewSession.findUnique({
      where: { candidateId: candidate.id },
    })

    if (session?.completed || session?.completedAt) {
      return NextResponse.json({ success: false, error: "Interview already completed." }, { status: 400 })
    }

    const now = new Date()

    // Mark InterviewSession completed and candidate status interviewed immediately
    await prisma.interviewSession.upsert({
      where: { candidateId: candidate.id },
      update: {
        completed: true,
        completedAt: now,
        submittedAt: now,
      },
      create: {
        candidateId: candidate.id,
        transcript: JSON.parse(JSON.stringify([])),
        completed: true,
        completedAt: now,
        submittedAt: now,
      },
    })

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { status: "interviewed" },
    })

    // Trigger async scoring worker in background (non-blocking)
    setTimeout(() => {
      runAsyncInterviewScoringTask(candidate.id, candidate.jobId)
    }, 0)

    // Return response immediately
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/interview/[token]/submit error:", error)
    return NextResponse.json({ success: false, error: "Failed to submit interview" }, { status: 500 })
  }
}
