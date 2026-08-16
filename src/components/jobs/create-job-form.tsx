"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, Resolver, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Briefcase, Building2, Check, MapPin, Sparkles } from "lucide-react"

import {
  createJobSchema,
  CreateJobSchemaType,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
} from "@/lib/validations/job"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SkillsTagInput } from "@/components/jobs/skills-tag-input"
import { SourcingConfigPanel } from "@/components/jobs/sourcing-config"
import { ScoringWeightsConfigPanel } from "@/components/jobs/scoring-weights-config"
import { DeleteJobDialog } from "@/components/jobs/delete-job-dialog"



interface InitialJobData {
  id: string
  title: string
  description: string
  experienceLevel: string
  employmentType: string
  location: string
  requiredSkills: string[]
  status: string
  sourcingConfig?: {
    linkedinEnabled: boolean
    upworkEnabled: boolean
    indeedEnabled: boolean
  } | null
  scoringWeights?: {
    resumeWeight: number
    testWeight: number
    interviewWeight: number
  } | null
}

interface CreateJobFormProps {
  initialJob?: InitialJobData | null
  jobId?: string
}

export function CreateJobForm({ initialJob, jobId }: CreateJobFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")
  const isEditing = Boolean(jobId && initialJob)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateJobSchemaType>({
    resolver: zodResolver(createJobSchema) as unknown as Resolver<CreateJobSchemaType>,
    defaultValues: {
      title: initialJob?.title ?? "",
      description: initialJob?.description ?? "",
      experienceLevel: (initialJob?.experienceLevel as any) ?? "Senior",
      employmentType: (initialJob?.employmentType as any) ?? "Full-time",
      location: initialJob?.location ?? "",
      requiredSkills: initialJob?.requiredSkills ?? [],
      sourcingConfig: {
        linkedinEnabled: initialJob?.sourcingConfig?.linkedinEnabled ?? true,
        upworkEnabled: initialJob?.sourcingConfig?.upworkEnabled ?? true,
        indeedEnabled: initialJob?.sourcingConfig?.indeedEnabled ?? false,
      },
      scoringWeights: {
        resumeWeight: initialJob?.scoringWeights?.resumeWeight ?? 30,
        testWeight: initialJob?.scoringWeights?.testWeight ?? 40,
        interviewWeight: initialJob?.scoringWeights?.interviewWeight ?? 30,
      },
    },
  })

  useEffect(() => {
    if (initialJob) {
      reset({
        title: initialJob.title ?? "",
        description: initialJob.description ?? "",
        experienceLevel: (initialJob.experienceLevel as any) ?? "Senior",
        employmentType: (initialJob.employmentType as any) ?? "Full-time",
        location: initialJob.location ?? "",
        requiredSkills: initialJob.requiredSkills ?? [],
        sourcingConfig: {
          linkedinEnabled: initialJob.sourcingConfig?.linkedinEnabled ?? true,
          upworkEnabled: initialJob.sourcingConfig?.upworkEnabled ?? true,
          indeedEnabled: initialJob.sourcingConfig?.indeedEnabled ?? false,
        },
        scoringWeights: {
          resumeWeight: initialJob.scoringWeights?.resumeWeight ?? 30,
          testWeight: initialJob.scoringWeights?.testWeight ?? 40,
          interviewWeight: initialJob.scoringWeights?.interviewWeight ?? 30,
        },
      })
    }
  }, [initialJob, reset])

  const titleValue = watch("title") || ""
  const descriptionValue = watch("description") || ""

  const onSubmit = async (data: CreateJobSchemaType) => {
    setIsSubmitting(true)
    setServerError("")

    try {
      const endpoint = isEditing ? `/api/jobs/${jobId}` : "/api/jobs"
      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || (isEditing ? "Failed to update job posting" : "Failed to create job posting")
        )
      }

      router.push(isEditing ? `/jobs/${jobId}` : "/jobs")
      router.refresh()
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred."
      setServerError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Extract validation errors for panels
  const sourcingError =
    errors.sourcingConfig?.root?.message ||
    (errors.sourcingConfig?.linkedinEnabled?.message as string | undefined)

  const scoringWeightsError =
    errors.scoringWeights?.root?.message ||
    (errors.scoringWeights?.resumeWeight?.message as string | undefined)


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {serverError}
        </div>
      ) : null}

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-slate-600" />
              Basic Information
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Provide general details about the position.
            </p>
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-sm font-medium text-slate-900">
                Job Title <span className="text-red-500">*</span>
              </Label>
              <span className="text-xs text-slate-400 font-mono">
                {titleValue.length}/100 chars
              </span>
            </div>
            <Input
              id="title"
              maxLength={100}
              placeholder="e.g. Senior Full Stack Engineer"
              {...register("title")}
              aria-invalid={!!errors.title}
              className={errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.title ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {errors.title.message}
              </p>
            ) : null}
          </div>

          {/* Experience Level & Employment Type Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Experience Level */}
            <div className="space-y-2">
              <Label htmlFor="experienceLevel" className="text-sm font-medium text-slate-900">
                Experience Level <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="experienceLevel"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="experienceLevel" aria-invalid={!!errors.experienceLevel}>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.experienceLevel ? (
                <p className="text-sm font-medium text-red-600" role="alert">
                  {errors.experienceLevel.message}
                </p>
              ) : null}
            </div>

            {/* Employment Type */}
            <div className="space-y-2">
              <Label htmlFor="employmentType" className="text-sm font-medium text-slate-900">
                Employment Type <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="employmentType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="employmentType" aria-invalid={!!errors.employmentType}>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.employmentType ? (
                <p className="text-sm font-medium text-red-600" role="alert">
                  {errors.employmentType.message}
                </p>
              ) : null}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="location" className="text-sm font-medium text-slate-900">
                Location <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setValue("location", "Remote", { shouldValidate: true })}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 underline flex items-center gap-1"
              >
                <MapPin className="h-3 w-3" /> Set to "Remote"
              </button>
            </div>
            <Input
              id="location"
              placeholder="e.g. San Francisco, CA or Remote"
              {...register("location")}
              aria-invalid={!!errors.location}
              className={errors.location ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.location ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {errors.location.message}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Role Details Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-600" />
              Role Description & Requirements
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Describe the responsibilities and specify required technical skills.
            </p>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-sm font-medium text-slate-900">
                Job Description <span className="text-red-500">*</span>
              </Label>
              <span
                className={`text-xs font-mono ${
                  descriptionValue.length < 100
                    ? "text-amber-600 font-semibold"
                    : "text-emerald-600"
                }`}
              >
                {descriptionValue.length} / 100 min chars
              </span>
            </div>
            <Textarea
              id="description"
              rows={8}
              placeholder="Provide a detailed overview of the role, responsibilities, team structure, and prerequisites..."
              {...register("description")}
              aria-invalid={!!errors.description}
              className={`min-h-[160px] leading-relaxed ${
                errors.description ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
            />
            {errors.description ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          {/* Required Skills */}
          <div className="space-y-2">
            <Label htmlFor="requiredSkills" className="text-sm font-medium text-slate-900">
              Required Skills <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="requiredSkills"
              control={control}
              render={({ field }) => (
                <SkillsTagInput
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.requiredSkills?.message}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sourcing Configuration Panel (Chunk 3) */}
      <Controller
        name="sourcingConfig"
        control={control}
        render={({ field }) => (
          <SourcingConfigPanel
            value={field.value}
            onChange={field.onChange}
            error={sourcingError}
          />
        )}
      />

      {/* Candidate Scoring Weights Panel */}
      <Controller
        name="scoringWeights"
        control={control}
        render={({ field }) => (
          <ScoringWeightsConfigPanel
            value={field.value}
            onChange={field.onChange}
            error={scoringWeightsError}
          />
        )}
      />


      {/* Form Action Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <div>
          {isEditing && jobId ? (
            <DeleteJobDialog
              jobId={jobId}
              jobTitle={initialJob?.title}
              variant="danger-button"
            />
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(isEditing ? `/jobs/${jobId}` : "/jobs")}
            disabled={isSubmitting}
            className="border-slate-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {isEditing ? "Saving Changes..." : "Saving Draft..."}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Check className="h-4 w-4" /> Save Changes
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Save as Draft
                  </>
                )}
              </span>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

