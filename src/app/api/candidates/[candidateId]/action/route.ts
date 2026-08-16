import { NextResponse } from "next/server"
import axios from "axios"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { candidateId } = await params
    const body = await request.json().catch(() => ({}))
    const { action } = body

    if (!action || !["shortlist", "reject", "hold"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be shortlist, reject, or hold." },
        { status: 400 }
      )
    }

    // Fetch candidate and verify HR manager ownership
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        job: {
          hrManagerId: session.user.id,
        },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    // Map action to status
    let newStatus: string
    if (action === "shortlist") {
      newStatus = "shortlisted"
    } else if (action === "reject") {
      newStatus = "rejected"
    } else {
      newStatus = "on_hold"
    }

    // Guard against double action
    if (candidate.status === newStatus) {
      let statusLabel = newStatus
      if (newStatus === "shortlisted") statusLabel = "shortlisted"
      if (newStatus === "rejected") statusLabel = "rejected"
      if (newStatus === "on_hold") statusLabel = "on hold"

      return NextResponse.json(
        { error: `Candidate is already ${statusLabel}.` },
        { status: 400 }
      )
    }

    // Execute Prisma transaction: update candidate status & insert audit log
    await prisma.$transaction([
      prisma.candidate.update({
        where: { id: candidateId },
        data: { status: newStatus },
      }),
      prisma.candidateStatusLog.create({
        data: {
          candidateId,
          jobId: candidate.jobId,
          action: action,
          takenBy: session.user.id,
          takenAt: new Date(),
        },
      }),
    ])

    // Construct n8n webhook payload
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    let webhookFailed = false

    if (webhookUrl) {
      const webhookPayload = {
        event: "candidate_action",
        action: action,
        candidate: {
          id: candidate.id,
          full_name: candidate.fullName,
          email: candidate.email,
        },
        job: {
          id: candidate.job.id,
          title: candidate.job.title,
        },
        company_name: "TalentFlow AI",
        hr_name: session.user.name || "HR Manager",
      }

      try {
        await axios.post(webhookUrl, webhookPayload, {
          timeout: 5000,
          headers: {
            "Content-Type": "application/json",
          },
        })
      } catch (webhookError) {
        console.warn("n8n webhook notification failed:", webhookError)
        webhookFailed = true
      }
    }

    if (webhookFailed) {
      return NextResponse.json({
        success: true,
        newStatus,
        warning: "Status updated. Email notification could not be sent.",
      })
    }

    return NextResponse.json({
      success: true,
      newStatus,
      message: "Candidate status updated and notified via email.",
    })
  } catch (error) {
    console.error("Failed to execute candidate action:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
