import { NextResponse } from "next/server"
import { validateInterviewToken } from "@/lib/candidate-token"
import { prisma } from "@/lib/prisma"
import axios from "axios"

const STATIC_MOCK_QUESTIONS = [
  "Tell me about yourself and your background.",
  "What is your experience with the primary technologies in this role?",
  "Describe a challenging technical problem you solved recently.",
  "How do you approach debugging a production issue?",
  "Tell me about a time you worked in a team under pressure.",
  "What is your approach to learning new technologies?",
  "Do you have any questions for us?",
]

/**
 * Generate next interview question using GPT-4o or static fallback
 */
export async function generateNextQuestionGPT(
  jobTitle: string,
  requiredSkills: string[],
  candidateSkills: string[],
  transcript: { question: string; answer: string; questionNumber?: number }[],
  targetQuestionNumber: number,
  isMock: boolean
): Promise<string> {
  const index = Math.min(Math.max(0, targetQuestionNumber - 1), 6)

  if (isMock) {
    return STATIC_MOCK_QUESTIONS[index]
  }

  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey || openaiApiKey.includes("xxxxxxxxxxxx")) {
    return STATIC_MOCK_QUESTIONS[index]
  }

  try {
    const systemPrompt = `You are an AI interviewer for TalentFlow AI. Generate the next interview question based on the context below. Return ONLY the question text — no preamble, no numbering, no explanation.`

    let questionTypeGuidance = ""
    if (targetQuestionNumber <= 2) {
      questionTypeGuidance = "Q1–Q2: background and motivation"
    } else if (targetQuestionNumber <= 4) {
      questionTypeGuidance = "Q3–Q4: technical depth based on candidate skills"
    } else if (targetQuestionNumber <= 6) {
      questionTypeGuidance = "Q5–Q6: behavioral / past experience"
    } else {
      questionTypeGuidance = "Q7: closing — invite candidate to ask questions or add context"
    }

    const userPrompt = `Job Title: ${jobTitle}
Required Skills: ${requiredSkills.join(", ")}
Candidate Skills: ${candidateSkills.join(", ")}
Conversation so far: ${JSON.stringify(transcript)}
Next question number: ${targetQuestionNumber}
Question type for Q${targetQuestionNumber}: ${questionTypeGuidance}
Rules:
- Never repeat a question already asked
- Keep question under 40 words
- Ask only one question at a time`

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 12000,
      }
    )

    const questionText = response.data?.choices?.[0]?.message?.content?.trim()
    if (questionText && questionText.length > 5) {
      return questionText.replace(/^["']|["']$/g, "")
    }
  } catch (err) {
    console.warn(`⚠️ GPT-4o question generation failed for Q${targetQuestionNumber}. Using fallback:`, err)
  }

  return STATIC_MOCK_QUESTIONS[index]
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { searchParams } = new URL(request.url)
    const isMock = searchParams.get("mock") === "true"

    const validation = await validateInterviewToken(token)

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, reason: validation.reason, error: "Invalid or expired interview token" },
        { status: 400 }
      )
    }

    const { candidate, job } = validation

    // Fetch or create interview session
    let session = await prisma.interviewSession.findUnique({
      where: { candidateId: candidate.id },
    })

    if (!session) {
      session = await prisma.interviewSession.create({
        data: {
          candidateId: candidate.id,
          transcript: JSON.parse(JSON.stringify([])),
          completed: false,
        },
      })
    }

    const transcript = (session.transcript as unknown as { question: string; answer: string; questionNumber?: number }[]) || []

    if (transcript.length >= 7 || session.completed || session.completedAt !== null) {
      return NextResponse.json({
        success: true,
        interviewComplete: true,
        questionNumber: 7,
        nextQuestion: "",
        transcript,
      })
    }

    const questionNumber = transcript.length + 1
    const nextQuestion = await generateNextQuestionGPT(
      job.title,
      job.requiredSkills,
      job.requiredSkills,
      transcript,
      questionNumber,
      isMock
    )

    return NextResponse.json({
      success: true,
      interviewComplete: false,
      questionNumber,
      nextQuestion,
      transcript,
    })
  } catch (error) {
    console.error("GET /api/interview/[token] error:", error)
    return NextResponse.json({ success: false, error: "Internal server error fetching interview state" }, { status: 500 })
  }
}
