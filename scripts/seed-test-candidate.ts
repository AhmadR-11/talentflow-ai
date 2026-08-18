import "dotenv/config"
import { randomUUID } from "crypto"
import { Resend } from "resend"
import { prisma } from "../src/lib/prisma"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Configuration variables for test candidate seed
const TEST_EMAIL = process.env.TEST_EMAIL || "candidate.test@example.com"
const TEST_CANDIDATE_NAME = process.env.TEST_CANDIDATE_NAME || "Ahmad Raza"
const TEST_JOB_ID = process.env.TEST_JOB_ID || ""

async function seedTestCandidate() {
  console.log("🌱 Starting realistic candidate seed process...\n")

  try {
    let job = null

    if (TEST_JOB_ID) {
      job = await prisma.jobPosting.findUnique({
        where: { id: TEST_JOB_ID },
        include: { scoringWeights: true, sourcingConfig: true },
      })
    }

    if (!job) {
      // Find the latest active or draft job posting
      job = await prisma.jobPosting.findFirst({
        orderBy: { createdAt: "desc" },
        include: { scoringWeights: true, sourcingConfig: true },
      })
    }

    if (!job) {
      console.log("ℹ️ No existing job found in DB. Creating sample HR Manager and Job Posting...")
      let hr = await prisma.hrManager.findFirst()
      if (!hr) {
        hr = await prisma.hrManager.create({
          data: {
            name: "Sarah Jenkins (HR Lead)",
            email: "hr.lead@talentflow.ai",
            passwordHash: "$2a$12$eW...demo",
          },
        })
      }

      job = await prisma.jobPosting.create({
        data: {
          hrManagerId: hr.id,
          title: "Senior Full-Stack Engineer (TypeScript/Next.js)",
          description:
            "We are seeking an experienced Full-Stack Engineer proficient in React, Next.js, TypeScript, and PostgreSQL to lead development of core scalable products.",
          experienceLevel: "Senior",
          employmentType: "Full-time",
          location: "San Francisco, CA (Remote)",
          requiredSkills: ["React", "TypeScript", "Next.js", "Node.js", "PostgreSQL", "Tailwind CSS"],
          status: "active",
          scoringWeights: {
            create: {
              resumeWeight: 30,
              testWeight: 40,
              interviewWeight: 30,
            },
          },
          sourcingConfig: {
            create: {
              linkedinEnabled: true,
              upworkEnabled: true,
              indeedEnabled: false,
            },
          },
        },
        include: { scoringWeights: true, sourcingConfig: true },
      })
    }

    console.log(`📌 Target Job Posting: "${job.title}" (ID: ${job.id})`)
    console.log(`📍 Location: ${job.location} | Level: ${job.experienceLevel}`)
    console.log(`🛠️ Required Skills: ${job.requiredSkills.join(", ")}`)

    // Determine realistic source platform based on job sourcing config
    let sourcePlatform = "linkedin"
    if (job.sourcingConfig) {
      if (job.sourcingConfig.linkedinEnabled) sourcePlatform = "linkedin"
      else if (job.sourcingConfig.upworkEnabled) sourcePlatform = "upwork"
      else if (job.sourcingConfig.indeedEnabled) sourcePlatform = "indeed"
    }

    // Generate complementary skills matching job requirements
    const complementarySkills = ["Docker", "Git & GitHub", "REST APIs", "CI/CD"]
    const candidateSkills = Array.from(new Set([...job.requiredSkills, ...complementarySkills]))

    const assessmentToken = randomUUID()
    const interviewToken = randomUUID()

    // Create realistic candidate entry
    const candidate = await prisma.candidate.create({
      data: {
        jobId: job.id,
        fullName: TEST_CANDIDATE_NAME,
        email: TEST_EMAIL,
        phone: "+92 326-4226424",
        location: job.location.includes("Remote") ? "San Francisco, CA" : job.location,
        sourcePlatform,
        profileUrl: `https://linkedin.com/in/${TEST_CANDIDATE_NAME.toLowerCase().replace(/\s+/g, "-")}`,
        resumeUrl: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
        skills: candidateSkills,
        status: "sourced",
        compositeScore: 8.8,
        aiSummary: `${TEST_CANDIDATE_NAME} is a highly qualified ${job.experienceLevel} developer with proven expertise in ${job.requiredSkills.slice(0, 4).join(", ")}. Strong match for the ${job.title} role with exceptional engineering background and leadership experience.`,
        assessmentToken,
        interviewToken,
        scores: {
          create: {
            resumeScore: 88,
            testScore: null,
            interviewScore: null,
            compositeScore: 8.8,
          },
        },
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const assessmentUrl = `${appUrl}/assessment/${assessmentToken}`
    const interviewUrl = `${appUrl}/interview/${interviewToken}`

    console.log("\n========================================================")
    console.log("✅ Realistic test candidate seeded successfully!")
    console.log("--------------------------------------------------------")
    console.log(`Candidate ID   : ${candidate.id}`)
    console.log(`Candidate Name : ${candidate.fullName}`)
    console.log(`Candidate Email: ${candidate.email}`)
    console.log(`Phone          : ${candidate.phone}`)
    console.log(`Location       : ${candidate.location}`)
    console.log(`Source Platform: ${candidate.sourcePlatform.toUpperCase()}`)
    console.log(`Job Title      : ${job.title}`)
    console.log("--------------------------------------------------------")
    console.log(`📋 Magic Assessment Link: ${assessmentUrl}`)
    console.log(`🎙️ Magic Interview Link  : ${interviewUrl}`)
    console.log("========================================================\n")

    // Send assessment link via Resend if RESEND_API_KEY is configured
    if (resend) {
      try {
        await resend.emails.send({
          from: "TalentFlow AI <onboarding@resend.dev>",
          to: TEST_EMAIL,
          subject: `Action Required: Skills Assessment for ${job.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #0f172a; margin-top: 0;">Candidate Application Status — TalentFlow AI</h2>
              <p>Hello <strong>${candidate.fullName}</strong>,</p>
              <p>Thank you for applying for the <strong>${job.title}</strong> role at our organization.</p>
              <p>We are excited to move forward with your evaluation process. Please complete the following evaluation steps:</p>
              
              <div style="margin: 24px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #4f46e5;">
                <h3 style="margin: 0 0 8px 0; color: #1e1b4b;">Step 1: Technical Skills Assessment</h3>
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #475569;">Demonstrate your domain expertise with our timed online skills evaluation test.</p>
                <a href="${assessmentUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Start Skills Assessment →</a>
              </div>

              <div style="margin: 24px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #0891b2;">
                <h3 style="margin: 0 0 8px 0; color: #083344;">Step 2: AI Voice/Text Interview</h3>
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #475569;">Participate in an interactive AI candidate interview session.</p>
                <a href="${interviewUrl}" style="display: inline-block; background-color: #0891b2; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Begin AI Interview →</a>
              </div>

              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="color: #64748b; font-size: 12px; margin: 0;">These unique magic access links were generated specifically for your application email (${TEST_EMAIL}).</p>
            </div>
          `,
        })
        console.log(`📧 Candidate email sent successfully to ${TEST_EMAIL} via Resend.`)
      } catch (emailErr) {
        console.warn("⚠️ Resend email dispatch failed:", emailErr)
      }
    } else {
      console.log("💡 Tip: RESEND_API_KEY is not set in .env. To automatically receive candidate email invites, add RESEND_API_KEY to your .env file.")
    }
  } catch (error) {
    console.error("❌ Seed failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTestCandidate()

