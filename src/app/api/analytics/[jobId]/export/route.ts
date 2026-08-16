import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Helper function to safely escape CSV fields according to RFC 4180
function escapeCsvValue(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""'
  const str = String(val)
  const escaped = str.replace(/"/g, '""')
  return `"${escaped}"`
}

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

    // Verify job ownership
    const job = await prisma.jobPosting.findFirst({
      where: {
        id: jobId,
        hrManagerId: session.user.id,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
    }

    // Fetch all candidates joined with candidate_scores
    const candidates = await prisma.candidate.findMany({
      where: { jobId },
      include: {
        scores: true,
      },
      orderBy: [
        { compositeScore: "desc" },
        { createdAt: "desc" },
      ],
    })

    // CSV Headers
    const headers = [
      "Full Name",
      "Email",
      "Phone",
      "Source",
      "Status",
      "Resume Score",
      "Test Score",
      "Interview Score",
      "Composite Score",
      "AI Summary",
      "Date Sourced",
    ]

    const csvRows = [headers.map(escapeCsvValue).join(",")]

    candidates.forEach((c) => {
      const row = [
        c.fullName,
        c.email,
        c.phone || "",
        c.sourcePlatform,
        c.status,
        c.scores?.resumeScore ? c.scores.resumeScore.toFixed(1) : "N/A",
        c.scores?.testScore ? c.scores.testScore.toFixed(1) : "N/A",
        c.scores?.interviewScore ? c.scores.interviewScore.toFixed(1) : "N/A",
        c.scores?.compositeScore
          ? c.scores.compositeScore.toFixed(1)
          : c.compositeScore
          ? c.compositeScore.toFixed(1)
          : "N/A",
        c.aiSummary || "",
        new Date(c.createdAt).toLocaleDateString(),
      ]

      csvRows.push(row.map(escapeCsvValue).join(","))
    })

    const csvContent = csvRows.join("\n")

    const filename = `talentflow-${jobId.slice(0, 8)}-candidates.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Failed to export candidates CSV:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
