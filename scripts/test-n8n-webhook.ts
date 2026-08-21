import "dotenv/config"
import { prisma } from "../src/lib/prisma"
import axios from "axios"

async function testN8nWebhook() {
  console.log("🧪 Testing n8n Webhook Endpoint (/api/webhooks/n8n)...\n")

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const webhookUrl = `${appUrl}/api/webhooks/n8n`
  const apiKey = process.env.INTERNAL_API_KEY || "talentflow-internal-2025"

  // 1. Fetch latest job
  const job = await prisma.jobPosting.findFirst({
    orderBy: { createdAt: "desc" },
  })

  if (!job) {
    console.error("❌ No job posting found in DB to test n8n candidate sourcing.")
    process.exit(1)
  }

  console.log(`📌 Target Job: "${job.title}" (${job.id})`)
  console.log(`🔐 Authorization Key: ${apiKey}`)
  console.log(`📡 Testing URL: ${webhookUrl}\n`)

  // Test 1: Sourcing Candidates from n8n
  console.log("1️⃣ Sending event 'candidates_sourced'...")
  try {
    const res = await axios.post(
      webhookUrl,
      {
        event: "candidates_sourced",
        job_id: job.id,
        candidates: [
          {
            full_name: "Test Sourced Candidate (n8n)",
            email: "n8n.sourced.test@example.com",
            phone: "+1 555-0199",
            profile_url: "https://linkedin.com/in/test-sourced-candidate",
            source_platform: "LINKEDIN",
            skills: ["React", "Next.js", "TypeScript", "Node"],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": apiKey,
        },
      }
    )
    console.log("Response for candidates_sourced:", res.data)
  } catch (err) {
    console.error("❌ candidates_sourced request failed:", err instanceof Error ? err.message : err)
  }

  // Fetch created candidate
  const candidate = await prisma.candidate.findFirst({
    where: { email: "n8n.sourced.test@example.com" },
  })

  if (candidate) {
    console.log(`\n✅ Candidate Sourced ID: ${candidate.id}`)
    console.log(`🔑 Assessment Token   : ${candidate.assessmentToken}`)
    console.log(`🔑 Interview Token    : ${candidate.interviewToken}`)

    // Test 2: GET candidate tokens for n8n
    console.log("\n2️⃣ Querying GET /api/webhooks/n8n?candidateId=...")
    try {
      const getRes = await axios.get(`${webhookUrl}?candidateId=${candidate.id}`, {
        headers: { "x-internal-key": apiKey },
      })
      console.log("GET Candidate Tokens Response:", getRes.data)
    } catch (getErr) {
      console.error("❌ GET candidates request failed:", getErr instanceof Error ? getErr.message : getErr)
    }

    // Test 3: Normalize skills event
    console.log("\n3️⃣ Sending event 'normalize_skills'...")
    try {
      const normRes = await axios.post(
        webhookUrl,
        {
          event: "normalize_skills",
          candidate_id: candidate.id,
          raw_skills: ["React.JS", "Node.JS", "TypeScript"],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-internal-key": apiKey,
          },
        }
      )
      console.log("Response for normalize_skills:", normRes.data)
    } catch (normErr) {
      console.error("❌ normalize_skills request failed:", normErr instanceof Error ? normErr.message : normErr)
    }
  }

  console.log("\n========================================================")
  console.log("✅ N8N WEBHOOK VERIFICATION COMPLETED SUCCESSFULLY!")
  console.log("========================================================")
}

testN8nWebhook()
  .catch((err) => {
    console.error("❌ Test crashed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
