import { NextResponse } from "next/server"
import axios from "axios"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const ACTION_STATUS_MAP: Record<string, string> = {
  pause: "paused",
  close: "closed",
  reopen: "active",
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
    const { action } = body

    if (!action || !["pause", "close", "reopen"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'pause', 'close', or 'reopen'" },
        { status: 400 }
      )
    }

    // Verify job existence and ownership
    const existingJob = await prisma.jobPosting.findFirst({
      where: {
        id: jobId,
        hrManagerId: session.user.id,
      },
      include: {
        sourcingConfig: true,
        scoringWeights: true,
      },
    })

    if (!existingJob) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
    }

    const oldStatus = existingJob.status
    const newStatus = ACTION_STATUS_MAP[action]

    // Execute atomic transaction for status update & audit log entry
    const updatedJob = await prisma.$transaction(async (tx) => {
      // 1. Update job status
      const updated = await tx.jobPosting.update({
        where: { id: jobId },
        data: { status: newStatus },
        include: {
          sourcingConfig: true,
          scoringWeights: true,
          _count: {
            select: { candidates: true },
          },
        },
      })

      // 2. Insert audit record into job_status_logs
      await tx.jobStatusLog.create({
        data: {
          jobId,
          oldStatus,
          newStatus,
          changedAt: new Date(),
        },
      })

      return updated
    })

    // If action is "reopen", fire n8n webhook notification
    if (action === "reopen") {
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
      let webhookSuccess = false

      if (n8nWebhookUrl) {
        const payload = {
          event: "job_reopened",
          job_id: updatedJob.id,
          job_title: updatedJob.title,
          job_description: updatedJob.description,
          experience_level: updatedJob.experienceLevel,
          required_skills: updatedJob.requiredSkills,
          sourcing: {
            linkedin: updatedJob.sourcingConfig?.linkedinEnabled ?? true,
            upwork: updatedJob.sourcingConfig?.upworkEnabled ?? true,
            indeed: updatedJob.sourcingConfig?.indeedEnabled ?? false,
          },
          scoring_weights: {
            resume: updatedJob.scoringWeights?.resumeWeight ?? 30,
            test: updatedJob.scoringWeights?.testWeight ?? 40,
            interview: updatedJob.scoringWeights?.interviewWeight ?? 30,
          },
        }

        try {
          const response = await axios.post(n8nWebhookUrl, payload, {
            headers: { "Content-Type": "application/json" },
            timeout: 5000,
          })

          if (response.status >= 200 && response.status < 300) {
            webhookSuccess = true
          }
        } catch (axiosErr) {
          console.warn(
            "n8n webhook call on reopen failed or timed out:",
            axiosErr instanceof Error ? axiosErr.message : axiosErr
          )
          webhookSuccess = false
        }
      }

      if (!webhookSuccess) {
        return NextResponse.json({
          success: true,
          warning: "Job status updated. Automation could not restart — please retry.",
          job: updatedJob,
        })
      }

      return NextResponse.json({
        success: true,
        message: "Job reopened and sourcing restarted.",
        job: updatedJob,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Job status updated to ${newStatus}`,
      job: updatedJob,
    })
  } catch (error) {
    console.error("Failed to update job status:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
