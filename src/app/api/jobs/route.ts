import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createJobSchema } from "@/lib/validations/job"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const jobs = await prisma.jobPosting.findMany({
      where: {
        hrManagerId: session.user.id,
        ...(status ? { status } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sourcingConfig: true,
        scoringWeights: true,
        _count: {
          select: { candidates: true },
        },
      },
    })

    return NextResponse.json({ success: true, jobs })
  } catch (error) {
    console.error("Failed to fetch jobs:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = createJobSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const payload = validation.data

    // Save across job_postings, job_sourcing_config, and job_scoring_weights via atomic nested write
    const job = await prisma.jobPosting.create({
      data: {
        hrManagerId: session.user.id,
        title: payload.title,
        description: payload.description,
        experienceLevel: payload.experienceLevel,
        employmentType: payload.employmentType,
        location: payload.location,
        requiredSkills: payload.requiredSkills,
        status: "draft",
        sourcingConfig: {
          create: {
            linkedinEnabled: payload.sourcingConfig.linkedinEnabled,
            upworkEnabled: payload.sourcingConfig.upworkEnabled,
            indeedEnabled: payload.sourcingConfig.indeedEnabled,
          },
        },
        scoringWeights: {
          create: {
            resumeWeight: payload.scoringWeights.resumeWeight,
            testWeight: payload.scoringWeights.testWeight,
            interviewWeight: payload.scoringWeights.interviewWeight,
          },
        },
      },
      include: {
        sourcingConfig: true,
        scoringWeights: true,
        _count: {
          select: { candidates: true },
        },
      },
    })

    return NextResponse.json({ success: true, job }, { status: 201 })
  } catch (error) {
    console.error("Failed to create job posting:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}

