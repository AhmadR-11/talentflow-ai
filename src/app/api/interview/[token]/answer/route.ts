import { NextResponse } from "next/server"
import { validateInterviewToken } from "@/lib/candidate-token"
import { prisma } from "@/lib/prisma"
import { generateNextQuestionGPT } from "../route"

export async function POST(
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
    const body = await request.json()
    const { question, answer, questionNumber } = body || {}

    if (!question || !answer) {
      return NextResponse.json({ success: false, error: "Question and answer parameters are required" }, { status: 400 })
    }

    // Fetch existing interview session
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

    if (session.completed || session.completedAt) {
      return NextResponse.json({ success: false, error: "Interview session is already completed." }, { status: 400 })
    }

    const existingTranscript = (session.transcript as unknown as { question: string; answer: string; questionNumber: number; answeredAt?: string }[]) || []
    const expectedQuestionNumber = existingTranscript.length + 1

    // Validate sequence order if questionNumber provided
    if (typeof questionNumber === "number" && questionNumber !== expectedQuestionNumber) {
      return NextResponse.json(
        {
          success: false,
          error: `Out-of-order sequence detected. Expected question ${expectedQuestionNumber}, received ${questionNumber}`,
        },
        { status: 400 }
      )
    }

    // Append new Q&A pair to transcript array
    const updatedTranscript = [
      ...existingTranscript,
      {
        question,
        answer,
        questionNumber: expectedQuestionNumber,
        answeredAt: new Date().toISOString(),
      },
    ]

    await prisma.interviewSession.update({
      where: { candidateId: candidate.id },
      data: {
        transcript: JSON.parse(JSON.stringify(updatedTranscript)),
      },
    })

    if (expectedQuestionNumber >= 7) {
      return NextResponse.json({
        success: true,
        nextQuestion: null,
        questionNumber: 7,
        interviewComplete: true,
        transcript: updatedTranscript,
      })
    }

    const nextQuestionNumber = expectedQuestionNumber + 1
    const nextQuestion = await generateNextQuestionGPT(
      job.title,
      job.requiredSkills,
      job.requiredSkills,
      updatedTranscript,
      nextQuestionNumber,
      isMock
    )

    return NextResponse.json({
      success: true,
      nextQuestion,
      questionNumber: nextQuestionNumber,
      interviewComplete: false,
      transcript: updatedTranscript,
    })
  } catch (error) {
    console.error("POST /api/interview/[token]/answer error:", error)
    return NextResponse.json({ success: false, error: "Failed to submit interview answer" }, { status: 500 })
  }
}
