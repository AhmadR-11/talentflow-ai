import { NextResponse } from "next/server"
import { generateCandidateSummary } from "@/services/summary.service"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get("force") === "true"

    const body = await request.json()
    const { candidateId } = body || {}

    if (!candidateId || typeof candidateId !== "string") {
      return NextResponse.json(
        { success: false, error: "candidateId parameter is required as a string." },
        { status: 400 }
      )
    }

    const result = await generateCandidateSummary(candidateId.trim(), force)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to generate candidate summary.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error("POST /api/scoring/summary error:", error)
    const message = error instanceof Error ? error.message : "Internal server error during summary generation"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
