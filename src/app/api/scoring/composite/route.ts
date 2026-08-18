import { NextResponse } from "next/server"
import { computeCompositeScore } from "@/services/scoring.service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { candidateId } = body || {}

    if (!candidateId || typeof candidateId !== "string") {
      return NextResponse.json(
        { success: false, error: "candidateId parameter is required as a string." },
        { status: 400 }
      )
    }

    const result = await computeCompositeScore(candidateId.trim())

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot compute composite score",
          reason: result.reason,
          missing: result.missing,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      compositeScore: result.compositeScore,
      tier: result.tier,
    })
  } catch (error) {
    console.error("POST /api/scoring/composite error:", error)
    const message = error instanceof Error ? error.message : "Internal server error during composite score calculation"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
