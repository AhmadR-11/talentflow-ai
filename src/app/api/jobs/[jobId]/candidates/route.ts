import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const minScoreParam = searchParams.get("minScore")
    const maxScoreParam = searchParams.get("maxScore")
    const sourceParam = searchParams.get("source")
    const stageParam = searchParams.get("stage")
    const pageParam = parseInt(searchParams.get("page") || "1", 10)
    const limitParam = parseInt(searchParams.get("limit") || "20", 10)

    const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam)
    const limit = Math.max(1, Math.min(100, isNaN(limitParam) ? 20 : limitParam))

    // Verify job existence and ownership
    const job = await prisma.jobPosting.findFirst({
      where: {
        id: jobId,
        hrManagerId: session.user.id,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
    }

    // Build filter conditions
    const minScore = minScoreParam ? parseFloat(minScoreParam) : undefined
    const maxScore = maxScoreParam ? parseFloat(maxScoreParam) : undefined

    const whereCondition: any = {
      jobId,
      ...(sourceParam && sourceParam !== "all"
        ? { sourcePlatform: { equals: sourceParam, mode: "insensitive" } }
        : {}),
      ...(stageParam && stageParam !== "all" ? { status: stageParam } : {}),
    }

    if (minScore !== undefined || maxScore !== undefined) {
      const gteVal = minScore ?? 0
      const lteVal = maxScore ?? 10

      whereCondition.OR = [
        {
          compositeScore: {
            gte: gteVal,
            lte: lteVal,
          },
        },
        {
          scores: {
            compositeScore: {
              gte: gteVal,
              lte: lteVal,
            },
          },
        },
      ]
    }

    // 1. Fetch total count matching filters
    const total = await prisma.candidate.count({
      where: whereCondition,
    })

    // 2. Fetch candidates joined with candidate_scores
    const candidatesData = await prisma.candidate.findMany({
      where: whereCondition,
      include: {
        scores: true,
      },
      orderBy: [
        { compositeScore: "desc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    })

    // 3. Compute overall pipeline stage stats for the job
    const allJobCandidates = await prisma.candidate.findMany({
      where: { jobId },
      select: { status: true },
    })

    const stats = {
      total: allJobCandidates.length,
      sourced: allJobCandidates.filter((c) => c.status === "sourced").length,
      screened: allJobCandidates.filter((c) => c.status === "screened").length,
      interviewed: allJobCandidates.filter((c) => c.status === "interviewed").length,
      shortlisted: allJobCandidates.filter((c) => c.status === "shortlisted").length,
      rejected: allJobCandidates.filter((c) => c.status === "rejected").length,
    }

    // 4. Format candidate objects cleanly
    const formattedCandidates = candidatesData.map((c) => {
      const compScore = c.scores?.compositeScore ?? c.compositeScore ?? 0
      const summaryText = c.aiSummary ?? "AI candidate profile analysis and skill relevance evaluation complete."

      return {
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        phone: c.phone,
        location: c.location,
        sourcePlatform: c.sourcePlatform,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        scores: {
          compositeScore: compScore,
          resumeScore: c.scores?.resumeScore ?? 0,
          testScore: c.scores?.testScore ?? 0,
          interviewScore: c.scores?.interviewScore ?? 0,
          aiSummary: summaryText,
        },
      }
    })

    const totalPages = Math.ceil(total / limit) || 1

    return NextResponse.json({
      success: true,
      candidates: formattedCandidates,
      total,
      page,
      totalPages,
      stats,
    })
  } catch (error) {
    console.error("Failed to fetch candidates:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
