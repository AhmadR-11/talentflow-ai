export type JobStatus = "draft" | "active" | "closed" | "archived"

export type ExperienceLevel = "Junior" | "Mid" | "Senior" | "Lead"

export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Freelance"

export interface SourcingConfigInput {
  linkedinEnabled: boolean
  upworkEnabled: boolean
  indeedEnabled: boolean
}

export interface JobPosting {
  id: string
  hrManagerId: string
  title: string
  description: string
  experienceLevel: ExperienceLevel | string
  employmentType: EmploymentType | string
  location: string
  requiredSkills: string[]
  status: JobStatus | string
  createdAt: string | Date
  sourcingConfig?: SourcingConfigInput
  _count?: {
    candidates?: number
  }
}

export interface CreateJobInput {
  title: string
  description: string
  experienceLevel: ExperienceLevel
  employmentType: EmploymentType
  location: string
  requiredSkills: string[]
  sourcingConfig: SourcingConfigInput
}
