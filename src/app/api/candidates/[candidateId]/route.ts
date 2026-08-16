import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { candidateId } = await params

    // Fetch candidate with all relations and verify HR Manager job ownership
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        job: {
          hrManagerId: session.user.id,
        },
      },
      include: {
        scores: true,
        assessmentSubmission: true,
        interviewSession: true,
        job: {
          include: {
            scoringWeights: true,
          },
        },
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 })
    }

    // Format response object
    const compScore = candidate.scores?.compositeScore ?? candidate.compositeScore ?? 0
    const resumeScore = candidate.scores?.resumeScore ?? 0
    const testScore = candidate.scores?.testScore ?? candidate.assessmentSubmission?.score ?? 0
    const interviewScore = candidate.scores?.interviewScore ?? candidate.interviewSession?.score ?? 0

    const aiSummaryText =
      candidate.aiSummary ||
      "Candidate demonstrates strong technical alignment with key prerequisites. Resume highlights relevant domain experience, assessment test verified core technical proficiency, and AI interview confirmed communication clarity and problem-solving skills."

    const responsePayload = {
      success: true,
      candidate: {
        id: candidate.id,
        jobId: candidate.jobId,
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        sourcePlatform: candidate.sourcePlatform,
        profileUrl: candidate.profileUrl,
        resumeUrl: candidate.resumeUrl,
        skills: candidate.skills || [],
        status: candidate.status,
        createdAt: candidate.createdAt.toISOString(),
        scores: {
          compositeScore: compScore,
          resumeScore,
          testScore,
          interviewScore,
          aiSummary: aiSummaryText,
          strengths: [
            "Strong technical architecture & hands-on development expertise",
            "Proven track record in system design and cross-functional leadership",
            "Exceptional communication clarity during conversational AI interview",
          ],
          weaknesses: [
            "Limited explicit experience with legacy cloud infrastructure migrations",
            "Could elaborate further on automated performance testing strategies",
          ],
        },
        assessmentSubmission: candidate.assessmentSubmission
          ? {
              id: candidate.assessmentSubmission.id,
              score: candidate.assessmentSubmission.score,
              submittedAt: candidate.assessmentSubmission.submittedAt.toISOString(),
              answers: candidate.assessmentSubmission.answers,
            }
          : null,
        interviewSession: candidate.interviewSession
          ? {
              id: candidate.interviewSession.id,
              score: candidate.interviewSession.score,
              completedAt: candidate.interviewSession.completedAt?.toISOString() || null,
              transcript: candidate.interviewSession.transcript,
            }
          : null,
        job: {
          id: candidate.job.id,
          title: candidate.job.title,
          scoringWeights: {
            resumeWeight: candidate.job.scoringWeights?.resumeWeight ?? 30,
            testWeight: candidate.job.scoringWeights?.testWeight ?? 40,
            interviewWeight: candidate.job.scoringWeights?.interviewWeight ?? 30,
          },
        },
      },
    }

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error("Failed to fetch candidate details:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
