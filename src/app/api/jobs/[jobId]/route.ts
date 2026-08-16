import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createJobSchema } from "@/lib/validations/job"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId } = await params

    const job = await prisma.jobPosting.findFirst({
      where: {
        id: jobId,
        hrManagerId: session.user.id,
      },
      include: {
        sourcingConfig: true,
        scoringWeights: true,
        _count: {
          select: { candidates: true },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error("Failed to fetch job posting:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId } = await params
    const body = await request.json()

    // Ensure the job exists and belongs to the HR manager
    const existingJob = await prisma.jobPosting.findFirst({
      where: {
        id: jobId,
        hrManagerId: session.user.id,
      },
    })

    if (!existingJob) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
    }

    // Validate update fields if provided
    const partialSchema = createJobSchema.partial()
    const validation = partialSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { sourcingConfig, scoringWeights, ...updateData } = validation.data

    const updatedJob = await prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        ...updateData,
        status: body.status ?? existingJob.status,
        ...(sourcingConfig
          ? {
              sourcingConfig: {
                upsert: {
                  create: sourcingConfig,
                  update: sourcingConfig,
                },
              },
            }
          : {}),
        ...(scoringWeights
          ? {
              scoringWeights: {
                upsert: {
                  create: scoringWeights,
                  update: scoringWeights,
                },
              },
            }
          : {}),
      },
      include: {
        sourcingConfig: true,
        scoringWeights: true,
        _count: {
          select: { candidates: true },
        },
      },
    })


    return NextResponse.json({ success: true, job: updatedJob })
  } catch (error) {
    console.error("Failed to update job posting:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId } = await params

    const existingJob = await prisma.jobPosting.findFirst({
      where: {
        id: jobId,
        hrManagerId: session.user.id,
      },
    })

    if (!existingJob) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
    }

    // Clean up candidate children, sourcing config, scoring weights, and the job posting
    const candidates = await prisma.candidate.findMany({
      where: { jobId },
      select: { id: true },
    })
    const candidateIds = candidates.map((c) => c.id)

    if (candidateIds.length > 0) {
      await prisma.candidateScore.deleteMany({
        where: { candidateId: { in: candidateIds } },
      }).catch(() => {})
      await prisma.assessmentSubmission.deleteMany({
        where: { candidateId: { in: candidateIds } },
      }).catch(() => {})
      await prisma.interviewSession.deleteMany({
        where: { candidateId: { in: candidateIds } },
      }).catch(() => {})
      await prisma.candidateStatusLog.deleteMany({
        where: { candidateId: { in: candidateIds } },
      }).catch(() => {})
      await prisma.candidate.deleteMany({
        where: { jobId },
      }).catch(() => {})
    }

    await prisma.jobSourcingConfig.deleteMany({ where: { jobId } }).catch(() => {})
    await prisma.jobScoringWeights.deleteMany({ where: { jobId } }).catch(() => {})
    await prisma.jobStatusLog.deleteMany({ where: { jobId } }).catch(() => {})

    await prisma.jobPosting.delete({
      where: { id: jobId },
    })

    return NextResponse.json({ success: true, message: "Job posting and all related data deleted" })
  } catch (error) {
    console.error("Failed to delete job posting:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
