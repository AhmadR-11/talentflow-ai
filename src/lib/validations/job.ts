import { z } from "zod"

export const EXPERIENCE_LEVELS = ["Junior", "Mid", "Senior", "Lead"] as const
export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Freelance"] as const

export const sourcingConfigSchema = z
  .object({
    linkedinEnabled: z.boolean().default(true),
    upworkEnabled: z.boolean().default(true),
    indeedEnabled: z.boolean().default(false),
  })
  .refine(
    (data) => data.linkedinEnabled || data.upworkEnabled || data.indeedEnabled,
    {
      message: "Please select at least one sourcing platform",
      path: ["linkedinEnabled"],
    }
  )

export const scoringWeightsSchema = z
  .object({
    resumeWeight: z.number().int().min(0).max(100).default(30),
    testWeight: z.number().int().min(0).max(100).default(40),
    interviewWeight: z.number().int().min(0).max(100).default(30),
  })
  .refine(
    (data) =>
      data.resumeWeight + data.testWeight + data.interviewWeight === 100,
    {
      message: "Evaluation weights must sum to exactly 100%",
      path: ["resumeWeight"],
    }
  )

export const createJobSchema = z.object({
  title: z
    .string()
    .min(1, "Job title is required")
    .max(100, "Job title must not exceed 100 characters"),
  description: z
    .string()
    .min(1, "Job description is required")
    .min(100, "Job description must be at least 100 characters"),
  experienceLevel: z.enum(EXPERIENCE_LEVELS, {
    message: "Select a valid experience level",
  }),
  employmentType: z.enum(EMPLOYMENT_TYPES, {
    message: "Select a valid employment type",
  }),
  location: z.string().min(1, "Location is required"),
  requiredSkills: z
    .array(z.string().min(1))
    .min(1, "At least one required skill is required"),
  sourcingConfig: sourcingConfigSchema.default({
    linkedinEnabled: true,
    upworkEnabled: true,
    indeedEnabled: false,
  }),
  scoringWeights: scoringWeightsSchema.default({
    resumeWeight: 30,
    testWeight: 40,
    interviewWeight: 30,
  }),
})

export type CreateJobSchemaType = z.infer<typeof createJobSchema>
export type SourcingConfigSchemaType = z.infer<typeof sourcingConfigSchema>
export type ScoringWeightsSchemaType = z.infer<typeof scoringWeightsSchema>

