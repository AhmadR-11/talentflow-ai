import { NextResponse } from "next/server"
import { validateAssessmentToken } from "@/lib/candidate-token"
import { prisma } from "@/lib/prisma"
import axios from "axios"

export interface MCQQuestion {
  questionId: string
  question: string
  options: string[]
  marks: number
  skillTested: string
  correctAnswer?: string
}

export interface ShortAnswerQuestion {
  questionId: string
  question: string
  marks: number
  skillTested: string
  modelAnswer?: string
  markingCriteria?: string
}

export interface PracticalQuestion {
  questionId: string
  question: string
  marks: number
  skillTested: string
  modelAnswer?: string
  markingCriteria?: string
}

export interface AssessmentSection {
  sectionName: string
  type: "mcq" | "short_answer" | "practical"
  questions: (MCQQuestion | ShortAnswerQuestion | PracticalQuestion)[]
}

export interface AssessmentData {
  timeLimitMinutes: number
  totalMarks: number
  sections: AssessmentSection[]
}

/**
 * Fallback generator for realistic test questions based on job skills
 */
function generateFallbackAssessment(jobTitle: string, requiredSkills: string[], experienceLevel: string): AssessmentData {
  const skillsList = requiredSkills.length > 0 ? requiredSkills : ["Software Architecture", "Problem Solving", "Code Quality"]
  const primarySkill = skillsList[0] || "Software Engineering"
  const secondarySkill = skillsList[1] || "System Design"

  const mcqQuestions: MCQQuestion[] = Array.from({ length: 10 }).map((_, idx) => {
    const skill = skillsList[idx % skillsList.length]
    return {
      questionId: `q${idx + 1}`,
      question: `In ${skill} development for a ${experienceLevel} level role, what is considered a core best practice when optimizing production performance?`,
      options: [
        `Implement efficient data structures and asynchronous handling for ${skill}`,
        `Use synchronous blocking operations across all database calls`,
        `Bypass automated linting and unit test coverage in production deployment`,
        `Hardcode static values and avoid modular function abstraction`,
      ],
      correctAnswer: `Implement efficient data structures and asynchronous handling for ${skill}`,
      marks: 5,
      skillTested: skill,
    }
  })

  const shortAnswerQuestions: ShortAnswerQuestion[] = [
    {
      questionId: "q11",
      question: `Explain how you would handle error logging, state management, and retry logic when integrating ${primarySkill} in a production application.`,
      modelAnswer: "Use structured error handling, clean state boundaries, exponential backoff for retries, and centralized telemetry.",
      markingCriteria: "Evaluates production error handling, state management knowledge, and resilience patterns.",
      marks: 10,
      skillTested: primarySkill,
    },
    {
      questionId: "q12",
      question: `Describe a scenario where you had to optimize performance or refactor complex legacy logic involving ${secondarySkill}. What steps did you take?`,
      modelAnswer: "Identify bottlenecks via profiling, establish baseline metrics, modularize code, and apply performance patterns.",
      markingCriteria: "Demonstrates practical performance profiling, refactoring methodology, and problem-solving.",
      marks: 10,
      skillTested: secondarySkill,
    },
    {
      questionId: "q13",
      question: `What strategies do you employ to ensure API security, data validation, and authorization guardrails when building features for ${jobTitle}?`,
      modelAnswer: "Implement JWT/session validation, schema validation with Zod, parameterized queries, and strict CORS/auth policies.",
      markingCriteria: "Assesses security awareness, input validation standards, and endpoint protection.",
      marks: 10,
      skillTested: "Security & API Design",
    },
    {
      questionId: "q14",
      question: `How do you write maintainable unit and integration tests for features using ${skillsList.slice(0, 3).join(", ")}?`,
      modelAnswer: "Mock external boundaries, test core business logic, maintain test isolation, and ensure high test coverage.",
      markingCriteria: "Evaluates testing strategies, test coverage best practices, and code maintainability.",
      marks: 10,
      skillTested: "Testing & Automation",
    },
  ]

  const practicalQuestion: PracticalQuestion = {
    questionId: "q15",
    question: `Practical Coding / System Architecture Task:\n\nDesign and write code or pseudo-code for a scalable module in ${primarySkill} that processes incoming concurrent candidate evaluation webhooks from an external service. Include data validation, database storage logic, and clean error handling.`,
    modelAnswer: "Defines asynchronous handler, schema validation, transaction persistence, and idempotent background processing.",
    markingCriteria: "Evaluates code cleanliness, concurrency management, data validation, and architecture clarity.",
    marks: 10,
    skillTested: `${primarySkill} Practical Architecture`,
  }

  return {
    timeLimitMinutes: 45,
    totalMarks: 100,
    sections: [
      {
        sectionName: "Multiple Choice",
        type: "mcq",
        questions: mcqQuestions,
      },
      {
        sectionName: "Short Answer",
        type: "short_answer",
        questions: shortAnswerQuestions,
      },
      {
        sectionName: "Practical Task",
        type: "practical",
        questions: [practicalQuestion],
      },
    ],
  }
}

/**
 * Sanitizes assessment payload by removing answer keys before returning to candidate
 */
function sanitizeAssessmentForCandidate(assessment: AssessmentData): AssessmentData {
  return {
    timeLimitMinutes: assessment.timeLimitMinutes || 45,
    totalMarks: assessment.totalMarks || 100,
    sections: assessment.sections.map((section) => ({
      ...section,
      questions: section.questions.map((q) => {
        const obj = { ...(q as unknown as Record<string, unknown>) }
        delete obj.correctAnswer
        delete obj.modelAnswer
        delete obj.markingCriteria
        return obj as unknown as MCQQuestion | ShortAnswerQuestion | PracticalQuestion
      }),
    })),
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const validation = await validateAssessmentToken(token)

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, reason: validation.reason, error: "Invalid or expired assessment token" },
        { status: 400 }
      )
    }

    const { candidate, job } = validation

    // Check if assessment already exists in DB for this job
    let dbAssessment = await prisma.jobAssessment.findUnique({
      where: { jobId: candidate.jobId },
    })

    let assessmentData: AssessmentData

    if (dbAssessment) {
      assessmentData = dbAssessment.questions as unknown as AssessmentData
    } else {
      // Generate assessment using OpenAI if API key available, else use structured fallback
      const openaiApiKey = process.env.OPENAI_API_KEY
      let generatedAssessment: AssessmentData | null = null

      if (openaiApiKey && !openaiApiKey.includes("xxxxxxxxxxxx")) {
        try {
          const prompt = `You are an assessment generator for TalentFlow AI.
Generate a skills assessment based on this job:
Title: ${job.title}
Required Skills: ${job.requiredSkills.join(", ")}
Experience Level: ${job.experienceLevel}

Return ONLY valid JSON in this exact structure:
{
  "timeLimitMinutes": 45,
  "totalMarks": 100,
  "sections": [
    {
      "sectionName": "Multiple Choice",
      "type": "mcq",
      "questions": [
        {
          "questionId": "q1",
          "question": "",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A",
          "marks": 5,
          "skillTested": ""
        }
      ]
    },
    {
      "sectionName": "Short Answer",
      "type": "short_answer",
      "questions": [
        {
          "questionId": "q11",
          "question": "",
          "modelAnswer": "",
          "markingCriteria": "",
          "marks": 10,
          "skillTested": ""
        }
      ]
    },
    {
      "sectionName": "Practical Task",
      "type": "practical",
      "questions": [
        {
          "questionId": "q15",
          "question": "",
          "modelAnswer": "",
          "markingCriteria": "",
          "marks": 10,
          "skillTested": ""
        }
      ]
    }
  ]
}
Rules: exactly 10 MCQ (5 marks each), 4 short answer (10 marks each), 1 practical (10 marks). Total = 100.`

          const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
              model: "gpt-4o",
              messages: [{ role: "system", content: prompt }],
              temperature: 0.7,
              response_format: { type: "json_object" },
            },
            {
              headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                "Content-Type": "application/json",
              },
              timeout: 15000,
            }
          )

          const content = response.data?.choices?.[0]?.message?.content
          if (content) {
            generatedAssessment = JSON.parse(content) as AssessmentData
          }
        } catch (aiErr) {
          console.warn("⚠️ OpenAI generation failed/timed out. Using high-quality fallback generator:", aiErr)
        }
      }

      if (!generatedAssessment || !generatedAssessment.sections) {
        generatedAssessment = generateFallbackAssessment(job.title, job.requiredSkills, job.experienceLevel)
      }

      // Save generated assessment to database
      dbAssessment = await prisma.jobAssessment.create({
        data: {
          jobId: candidate.jobId,
          questions: JSON.parse(JSON.stringify(generatedAssessment)),
          totalMarks: generatedAssessment.totalMarks || 100,
          timeLimitMinutes: generatedAssessment.timeLimitMinutes || 45,
        },
      })

      assessmentData = generatedAssessment
    }

    // Strip correct answers before returning to candidate
    const sanitized = sanitizeAssessmentForCandidate(assessmentData)

    return NextResponse.json({
      success: true,
      candidate,
      job,
      assessment: sanitized,
    })
  } catch (error) {
    console.error("GET /api/assessment/[token] error:", error)
    return NextResponse.json({ success: false, error: "Internal server error fetching assessment" }, { status: 500 })
  }
}
