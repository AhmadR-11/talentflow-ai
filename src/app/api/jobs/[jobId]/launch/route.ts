import { NextResponse } from "next/server"
import axios from "axios"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId } = await params

    // Fetch existing job with relations
    const job = await prisma.jobPosting.findFirst({
      where: {
        id: jobId,
        hrManagerId: session.user.id,
      },
      include: {
        sourcingConfig: true,
        scoringWeights: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
    }

    // 1. Update job status to 'active' in database
    const updatedJob = await prisma.jobPosting.update({
      where: { id: jobId },
      data: { status: "active" },
      include: {
        sourcingConfig: true,
        scoringWeights: true,
      },
    })

    // 2. Build n8n webhook payload
    const payload = {
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

    // 3. Fire POST request to n8n webhook URL
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL

    let webhookSuccess = false

    if (n8nWebhookUrl) {
      try {
        const response = await axios.post(n8nWebhookUrl, payload, {
          headers: { "Content-Type": "application/json" },
          timeout: 5000, // 5 second timeout
        })

        if (response.status >= 200 && response.status < 300) {
          webhookSuccess = true
        }
      } catch (axiosErr) {
        console.warn("n8n webhook call failed or timed out:", axiosErr instanceof Error ? axiosErr.message : axiosErr)
        webhookSuccess = false
      }
    } else {
      console.warn("N8N_WEBHOOK_URL environment variable is not configured.")
    }

    // 4. Return appropriate response without rolling back DB status
    if (webhookSuccess) {
      return NextResponse.json({
        success: true,
        message: "Job launched successfully",
        job: updatedJob,
      })
    }

    return NextResponse.json({
      success: true,
      warning: "Job saved. Automation could not be started — please retry from job settings.",
      job: updatedJob,
    })
  } catch (error) {
    console.error("Failed to launch job posting:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
