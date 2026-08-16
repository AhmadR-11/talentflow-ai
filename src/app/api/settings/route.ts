import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hrManager = await prisma.hrManager.findUnique({
      where: { id: session.user.id },
      include: {
        preferences: true,
      },
    })

    if (!hrManager) {
      return NextResponse.json({ error: "HR Manager account not found" }, { status: 404 })
    }

    const defaultWeights =
      (hrManager.preferences?.defaultWeights as { resume: number; test: number; interview: number }) || {
        resume: 30,
        test: 40,
        interview: 30,
      }

    return NextResponse.json({
      success: true,
      profile: {
        id: hrManager.id,
        name: hrManager.name,
        email: hrManager.email,
        createdAt: hrManager.createdAt.toISOString(),
        preferences: {
          defaultWeights,
          notifyPipeline: hrManager.preferences?.notifyPipeline ?? true,
          notifyComplete: hrManager.preferences?.notifyComplete ?? true,
        },
      },
    })
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
