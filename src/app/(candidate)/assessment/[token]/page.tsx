import { redirect } from "next/navigation"
import { validateAssessmentToken } from "@/lib/candidate-token"
import { AssessmentShell } from "@/components/assessment/AssessmentShell"
import { headers } from "next/headers"

interface AssessmentPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function CandidateAssessmentTokenPage({ params }: AssessmentPageProps) {
  const { token } = await params

  const res = await validateAssessmentToken(token)

  if (!res.valid) {
    if (res.reason === "already_submitted") {
      redirect("/assessment-complete")
    }
    redirect("/link-expired")
  }

  const { candidate, job } = res

  // Fetch assessment questions from API route
  const headerList = await headers()
  const host = headerList.get("host") || "localhost:3000"
  const protocol = host.includes("localhost") ? "http" : "https"
  const apiUrl = `${protocol}://${host}/api/assessment/${token}`

  let assessmentData = null

  try {
    const apiRes = await fetch(apiUrl, { cache: "no-store" })
    if (apiRes.ok) {
      const data = await apiRes.json()
      if (data.success && data.assessment) {
        assessmentData = data.assessment
      }
    }
  } catch (err) {
    console.error("Failed to fetch assessment payload in page component:", err)
  }

  if (!assessmentData) {
    // Fallback assessment structure if fetch failed
    const fallbackSkills = job.requiredSkills.length > 0 ? job.requiredSkills : ["Problem Solving"]
    assessmentData = {
      timeLimitMinutes: 45,
      totalMarks: 100,
      sections: [
        {
          sectionName: "Multiple Choice",
          type: "mcq",
          questions: Array.from({ length: 10 }).map((_, idx) => ({
            questionId: `q${idx + 1}`,
            question: `In ${fallbackSkills[idx % fallbackSkills.length]} development for a ${job.experienceLevel} level role, what is considered a core best practice when optimizing production performance?`,
            options: [
              `Implement efficient data structures and asynchronous handling for ${fallbackSkills[idx % fallbackSkills.length]}`,
              `Use synchronous blocking operations across all database calls`,
              `Bypass automated linting and unit test coverage in production deployment`,
              `Hardcode static values and avoid modular function abstraction`,
            ],
            marks: 5,
            skillTested: fallbackSkills[idx % fallbackSkills.length],
          })),
        },
        {
          sectionName: "Short Answer",
          type: "short_answer",
          questions: [
            {
              questionId: "q11",
              question: `Explain how you would handle error logging, state management, and retry logic when integrating ${fallbackSkills[0]} in a production application.`,
              marks: 10,
              skillTested: fallbackSkills[0],
            },
            {
              questionId: "q12",
              question: `Describe a scenario where you had to optimize performance or refactor complex logic involving ${fallbackSkills[1] || fallbackSkills[0]}. What steps did you take?`,
              marks: 10,
              skillTested: fallbackSkills[1] || fallbackSkills[0],
            },
            {
              questionId: "q13",
              question: `What strategies do you employ to ensure API security, data validation, and authorization guardrails when building features for ${job.title}?`,
              marks: 10,
              skillTested: "Security & API Design",
            },
            {
              questionId: "q14",
              question: `How do you write maintainable unit and integration tests for features using ${fallbackSkills.slice(0, 3).join(", ")}?`,
              marks: 10,
              skillTested: "Testing & Automation",
            },
          ],
        },
        {
          sectionName: "Practical Task",
          type: "practical",
          questions: [
            {
              questionId: "q15",
              question: `Practical Coding / System Architecture Task:\n\nDesign and write code or pseudo-code for a scalable module in ${fallbackSkills[0]} that processes incoming concurrent candidate evaluation webhooks from an external service. Include data validation, database storage logic, and clean error handling.`,
              marks: 10,
              skillTested: `${fallbackSkills[0]} Practical Architecture`,
            },
          ],
        },
      ],
    }
  }

  return (
    <AssessmentShell
      token={token}
      candidate={candidate}
      job={job}
      assessment={assessmentData}
    />
  )
}
