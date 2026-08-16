import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { defaultWeights, notifyPipeline, notifyComplete } = body

    // Validate defaultWeights if provided
    if (defaultWeights) {
      const { resume = 0, test = 0, interview = 0 } = defaultWeights
      const total = Number(resume) + Number(test) + Number(interview)

      if (total !== 100) {
        return NextResponse.json(
          { error: "Scoring weights must sum to 100." },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (defaultWeights) updateData.defaultWeights = defaultWeights
    if (typeof notifyPipeline === "boolean") updateData.notifyPipeline = notifyPipeline
    if (typeof notifyComplete === "boolean") updateData.notifyComplete = notifyComplete

    const preferences = await prisma.hrPreference.upsert({
      where: { hrManagerId: session.user.id },
      create: {
        hrManagerId: session.user.id,
        defaultWeights: defaultWeights || { resume: 30, test: 40, interview: 30 },
        notifyPipeline: notifyPipeline ?? true,
        notifyComplete: notifyComplete ?? true,
      },
      update: updateData,
    })

    return NextResponse.json({
      success: true,
      message: "Preferences saved.",
      preferences,
    })
  } catch (error) {
    console.error("Failed to update preferences:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
