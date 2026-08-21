import { NextResponse } from "next/server"
import { runResumeMatchingPipeline } from "@/lib/resume-matcher"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    let candidateId = (body.candidateId || body.candidate_id || body.id || "").trim()
    let jobId = (body.jobId || body.job_id || "").trim()

    // Fallback 1: Find candidate by email if passed
    if (!candidateId && body.email) {
      const candByEmail = await prisma.candidate.findFirst({
        where: { email: body.email.trim() },
        orderBy: { createdAt: "desc" },
      })
      candidateId = candByEmail?.id || ""
      jobId = jobId || candByEmail?.jobId || ""
    }

    // Fallback 2: Find latest candidate in database for standalone node testing
    if (!candidateId) {
      const latestCandidate = await prisma.candidate.findFirst({
        orderBy: { createdAt: "desc" },
      })
      candidateId = latestCandidate?.id || ""
      jobId = jobId || latestCandidate?.jobId || ""
    }

    // Fallback 3: Find latest job in database
    if (!jobId) {
      const latestJob = await prisma.jobPosting.findFirst({
        orderBy: { createdAt: "desc" },
      })
      jobId = latestJob?.id || ""
    }

    if (!candidateId || !jobId) {
      return NextResponse.json(
        { success: false, error: "candidateId and jobId parameters could not be resolved." },
        { status: 400 }
      )
    }

    const result = await runResumeMatchingPipeline(candidateId, jobId)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("POST /api/scoring/resume-match error:", error)
    const message = error instanceof Error ? error.message : "Internal server error during resume matching"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
