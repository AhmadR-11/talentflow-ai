import { NextResponse } from "next/server"
import { runResumeMatchingPipeline } from "@/lib/resume-matcher"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { candidateId, jobId } = body || {}

    if (!candidateId || typeof candidateId !== "string" || !jobId || typeof jobId !== "string") {
      return NextResponse.json(
        { success: false, error: "candidateId and jobId parameters are required strings." },
        { status: 400 }
      )
    }

    const result = await runResumeMatchingPipeline(candidateId.trim(), jobId.trim())

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
