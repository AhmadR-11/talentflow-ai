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

    // Verify job existence and HR manager ownership
    const job = await prisma.jobPosting.findFirst({
      where: {
        id: jobId,
        hrManagerId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        requiredSkills: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
    }

    // 1. Funnel Metrics
    const allCandidates = await prisma.candidate.findMany({
      where: { jobId },
      select: {
        id: true,
        status: true,
        skills: true,
        sourcePlatform: true,
        createdAt: true,
        scores: {
          select: {
            compositeScore: true,
          },
        },
        compositeScore: true,
      },
    })

    const totalCount = allCandidates.length

    const funnel = {
      total_sourced: totalCount,
      screened: allCandidates.filter(
        (c) => ["screened", "interviewed", "shortlisted", "rejected"].includes(c.status)
      ).length,
      interviewed: allCandidates.filter(
        (c) => ["interviewed", "shortlisted"].includes(c.status)
      ).length,
      shortlisted: allCandidates.filter((c) => c.status === "shortlisted").length,
      rejected: allCandidates.filter((c) => c.status === "rejected").length,
    }

    // Funnel Conversion percentages
    const conversion = {
      sourcedToScreened: totalCount > 0 ? Math.round((funnel.screened / totalCount) * 100) : 0,
      screenedToInterviewed: funnel.screened > 0 ? Math.round((funnel.interviewed / funnel.screened) * 100) : 0,
      interviewedToShortlisted: funnel.interviewed > 0 ? Math.round((funnel.shortlisted / funnel.interviewed) * 100) : 0,
      overallShortlistRate: totalCount > 0 ? Math.round((funnel.shortlisted / totalCount) * 100) : 0,
    }

    // 2. Score Metrics (Avg, Max, Min)
    const validScores = allCandidates
      .map((c) => c.scores?.compositeScore ?? c.compositeScore)
      .filter((s): s is number => s !== null && s !== undefined && !isNaN(s))

    const avgScore = validScores.length > 0
      ? validScores.reduce((acc, val) => acc + val, 0) / validScores.length
      : 0
    const highestScore = validScores.length > 0 ? Math.max(...validScores) : 0
    const lowestScore = validScores.length > 0 ? Math.min(...validScores) : 0

    // 3. Source Performance (avg score per platform)
    const sourceGroups: Record<string, { total: number; sumScore: number }> = {}

    allCandidates.forEach((c) => {
      const platform = c.sourcePlatform || "Unknown"
      const scoreVal = c.scores?.compositeScore ?? c.compositeScore ?? 0

      if (!sourceGroups[platform]) {
        sourceGroups[platform] = { total: 0, sumScore: 0 }
      }
      sourceGroups[platform].total += 1
      sourceGroups[platform].sumScore += scoreVal
    })

    const sourcePerformance = Object.entries(sourceGroups).map(([platform, data]) => {
      const avg = data.total > 0 ? data.sumScore / data.total : 0
      return {
        source_platform: platform,
        avg_score: Number(avg.toFixed(1)),
        total: data.total,
      }
    }).sort((a, b) => b.avg_score - a.avg_score)

    const bestPerformingSource = sourcePerformance[0]?.source_platform || "N/A"

    // 4. Skill Gap Analysis
    const requiredSkills = job.requiredSkills || []
    const skillGapList: Array<{ skill: string; missingCount: number; missingPercentage: number }> = []

    requiredSkills.forEach((reqSkill) => {
      const lowerReq = reqSkill.toLowerCase().trim()

      const missingCount = allCandidates.filter((c) => {
        const candidateSkills = (c.skills || []).map((s) => s.toLowerCase().trim())
        return !candidateSkills.some((s) => s.includes(lowerReq) || lowerReq.includes(s))
      }).length

      const missingPercentage = totalCount > 0 ? Math.round((missingCount / totalCount) * 100) : 0

      skillGapList.push({
        skill: reqSkill,
        missingCount,
        missingPercentage,
      })
    })

    skillGapList.sort((a, b) => b.missingPercentage - a.missingPercentage)
    const topMissingSkills = skillGapList.slice(0, 5)

    // 5. Time to Shortlist (Avg hours from candidate creation to shortlist action in candidate_status_logs)
    let avgHoursToShortlist = 0
    try {
      const shortlistLogs = await prisma.candidateStatusLog.findMany({
        where: {
          action: { in: ["shortlist", "shortlisted"] },
          jobId,
        },
        select: {
          takenAt: true,
          candidate: {
            select: { createdAt: true },
          },
        },
      })

      if (shortlistLogs.length > 0) {
        const totalHours = shortlistLogs.reduce((acc, log) => {
          const hours = (log.takenAt.getTime() - log.candidate.createdAt.getTime()) / (1000 * 60 * 60)
          return acc + Math.max(0, hours)
        }, 0)
        avgHoursToShortlist = Number((totalHours / shortlistLogs.length).toFixed(1))
      }
    } catch (e) {
      console.warn("Error calculating time to shortlist:", e)
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
      },
      funnel,
      conversion,
      scores: {
        avgScore: Number(avgScore.toFixed(1)),
        highestScore: Number(highestScore.toFixed(1)),
        lowestScore: Number(lowestScore.toFixed(1)),
      },
      sourcePerformance,
      bestPerformingSource,
      topMissingSkills,
      avgHoursToShortlist,
    })
  } catch (error) {
    console.error("Failed to fetch analytics:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
