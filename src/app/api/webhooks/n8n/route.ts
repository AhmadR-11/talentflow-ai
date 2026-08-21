import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"
import { runScoringPipeline } from "@/services/orchestrator.service"

// Validate internal key from n8n request headers
function validateInternalKey(req: NextRequest): boolean {
  const key = req.headers.get("x-internal-key")
  const configuredKey = process.env.INTERNAL_API_KEY
  if (!configuredKey) return true // Allow in dev if key not configured
  return key === configuredKey
}

export async function POST(req: NextRequest) {
  // Auth check
  if (!validateInternalKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Invalid x-internal-key." },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()
    const { event } = body || {}

    console.log("📥 n8n webhook event received:", event)

    switch (event) {
      // W1 — Candidates sourced from external platforms (LinkedIn, Upwork, Indeed)
      case "candidates_sourced": {
        const candidatesList = Array.isArray(body.candidates) ? body.candidates : []
        let targetJobId = body.job_id || body.jobId

        // Fallback 1: Extract job_id from candidate objects in array
        if (!targetJobId && candidatesList.length > 0) {
          targetJobId = candidatesList[0]?.job_id || candidatesList[0]?.jobId
        }

        // Fallback 2: Fetch latest job from DB (for standalone n8n node manual testing)
        if (!targetJobId) {
          const latestJob = await prisma.jobPosting.findFirst({
            orderBy: { createdAt: "desc" },
          })
          targetJobId = latestJob?.id
        }

        if (!targetJobId) {
          return NextResponse.json(
            { error: "job_id is required and no job posting was found in database." },
            { status: 400 }
          )
        }

        if (candidatesList.length === 0) {
          console.warn("⚠️ candidates_sourced received 0 candidates for job:", targetJobId)
          return NextResponse.json({ success: true, saved: 0, skipped: 0, message: "No candidates provided in array." })
        }

        let saved = 0
        let skipped = 0

        for (const c of candidatesList) {
          try {
            const email = c.email?.trim() || `candidate_${randomUUID().slice(0, 8)}@placeholder.com`
            const skillsList = Array.isArray(c.skills) ? c.skills : []

            // Find existing candidate by email & jobId
            const existing = await prisma.candidate.findFirst({
              where: {
                jobId: targetJobId,
                email: email,
              },
            })

            if (existing) {
              await prisma.candidate.update({
                where: { id: existing.id },
                data: {
                  fullName: c.full_name ?? existing.fullName,
                  phone: c.phone ?? existing.phone,
                  profileUrl: c.profile_url ?? existing.profileUrl,
                  sourcePlatform: c.source_platform ?? existing.sourcePlatform,
                  skills: skillsList.length > 0 ? skillsList : existing.skills,
                },
              })
            } else {
              await prisma.candidate.create({
                data: {
                  jobId: targetJobId,
                  fullName: c.full_name ?? "Sourced Candidate",
                  email: email,
                  phone: c.phone ?? null,
                  profileUrl: c.profile_url ?? null,
                  sourcePlatform: c.source_platform || "LINKEDIN",
                  skills: skillsList,
                  status: "sourced",
                  assessmentToken: randomUUID(),
                  interviewToken: randomUUID(),
                },
              })
            }
            saved++
          } catch (err) {
            console.error("❌ Failed to save candidate from n8n webhook:", err)
            skipped++
          }
        }

        return NextResponse.json({ success: true, saved, skipped })
      }

      // W2 — Normalize skills for a candidate
      case "normalize_skills": {
        let targetCandidateId = body.candidate_id || body.candidateId || body.id
        const email = body.email?.trim()
        const rawSkillsList = Array.isArray(body.raw_skills)
          ? body.raw_skills
          : Array.isArray(body.skills)
          ? body.skills
          : []

        // Fallback 1: Find candidate by email if candidate_id is missing/null/empty
        if (!targetCandidateId && email) {
          const candidateByEmail = await prisma.candidate.findFirst({
            where: { email: email },
            orderBy: { createdAt: "desc" },
          })
          targetCandidateId = candidateByEmail?.id
        }

        // Fallback 2: Find latest candidate in database for standalone node testing
        if (!targetCandidateId) {
          const latestCandidate = await prisma.candidate.findFirst({
            orderBy: { createdAt: "desc" },
          })
          targetCandidateId = latestCandidate?.id
        }

        if (!targetCandidateId) {
          return NextResponse.json(
            { error: "candidate_id is required and no candidate was found in database." },
            { status: 400 }
          )
        }

        const normalized = rawSkillsList.map((skill: any) =>
          String(skill)
            .toLowerCase()
            .replace(/\./g, "")
            .replace(/js$/i, "")
            .trim()
        )

        await prisma.candidate.update({
          where: { id: targetCandidateId },
          data: { skills: normalized },
        })

        return NextResponse.json({ success: true, candidateId: targetCandidateId, skills: normalized, normalized })
      }

      // W3 — Update candidate status (e.g. auto reject, shortlisted, screened)
      case "update_candidate_status": {
        let targetCandidateId = body.candidate_id || body.candidateId || body.id
        const { status } = body

        if (!targetCandidateId) {
          const latestCandidate = await prisma.candidate.findFirst({ orderBy: { createdAt: "desc" } })
          targetCandidateId = latestCandidate?.id
        }

        if (!targetCandidateId || !status) {
          return NextResponse.json(
            { error: "candidate_id and status are required." },
            { status: 400 }
          )
        }

        await prisma.candidate.update({
          where: { id: targetCandidateId },
          data: { status },
        })

        return NextResponse.json({ success: true, candidateId: targetCandidateId, status })
      }

      // W4 — Trigger Candidate Scoring Pipeline from n8n
      case "run_scoring": {
        let targetCandidateId = body.candidate_id || body.candidateId || body.id
        let targetJobId = body.job_id || body.jobId

        if (!targetCandidateId) {
          const latestCandidate = await prisma.candidate.findFirst({ orderBy: { createdAt: "desc" } })
          targetCandidateId = latestCandidate?.id
          targetJobId = targetJobId || latestCandidate?.jobId
        }

        if (!targetCandidateId || !targetJobId) {
          return NextResponse.json(
            { error: "candidate_id and job_id are required." },
            { status: 400 }
          )
        }

        const result = await runScoringPipeline(targetCandidateId, targetJobId)
        return NextResponse.json({ success: true, ...result })
      }

      // W5 — Trigger W2 Parse Resumes event from n8n
      case "parse_resumes": {
        const { job_id, candidates } = body
        const candidateCount = Array.isArray(candidates) ? candidates.length : 0
        console.log(`📄 Received parse_resumes event for job ${job_id ?? "unknown"} (${candidateCount} candidates)`)

        return NextResponse.json({
          success: true,
          message: "Parse resumes event received successfully.",
          jobId: job_id ?? null,
          candidateCount,
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown event: ${event}`, supportedEvents: ["candidates_sourced", "normalize_skills", "update_candidate_status", "run_scoring", "parse_resumes"] },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("POST /api/webhooks/n8n error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET /api/webhooks/n8n?candidateId=... (Fetch candidate tokens & magic links for n8n email automation)
export async function GET(req: NextRequest) {
  if (!validateInternalKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Invalid x-internal-key." },
      { status: 401 }
    )
  }

  let candidateId = req.nextUrl.searchParams.get("candidateId")

  if (!candidateId) {
    const latest = await prisma.candidate.findFirst({ orderBy: { createdAt: "desc" } })
    candidateId = latest?.id || null
  }

  if (!candidateId) {
    return NextResponse.json(
      { error: "candidateId search parameter is required and no candidate was found in database." },
      { status: 400 }
    )
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      fullName: true,
      email: true,
      assessmentToken: true,
      interviewToken: true,
      jobId: true,
      status: true,
    },
  })

  if (!candidate) {
    return NextResponse.json(
      { error: "Candidate not found." },
      { status: 404 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  return NextResponse.json({
    success: true,
    candidate: {
      ...candidate,
      assessmentUrl: `${appUrl}/assessment/${candidate.assessmentToken}`,
      interviewUrl: `${appUrl}/interview/${candidate.interviewToken}`,
    },
  })
}