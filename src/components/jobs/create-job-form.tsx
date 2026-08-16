"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, Resolver, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Briefcase, Building2, Check, MapPin, Rocket, Sparkles } from "lucide-react"
import { toast } from "sonner"

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
  const [isLaunching, setIsLaunching] = useState(false)
  const [serverError, setServerError] = useState("")
  const isEditing = Boolean(jobId && initialJob)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    getValues,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateJobSchemaType>({
    resolver: zodResolver(createJobSchema) as unknown as Resolver<CreateJobSchemaType>,
    mode: "onChange",
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
    } else {
      // Fetch HR Manager's default scoring weights from settings
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.profile?.preferences?.defaultWeights) {
            const weights = data.profile.preferences.defaultWeights
            setValue("scoringWeights.resumeWeight", weights.resume ?? 30)
            setValue("scoringWeights.testWeight", weights.test ?? 40)
            setValue("scoringWeights.interviewWeight", weights.interview ?? 30)
          }
        })
        .catch(() => {
          // Fallback to 30/40/30 defaults
        })
    }
  }, [initialJob, reset, setValue])

  const titleValue = watch("title") || ""
  const descriptionValue = watch("description") || ""

  // Helper to save job (draft or update)
  const saveJobData = async (data: CreateJobSchemaType) => {
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

    return result.job
  }

  // 1. Save as Draft Handler
  const onSubmitDraft = async (data: CreateJobSchemaType) => {
    setIsSubmitting(true)
    setServerError("")

    try {
      const savedJob = await saveJobData(data)
      toast.success(isEditing ? "Job updated successfully!" : "Job draft saved successfully!")
      router.push(isEditing ? `/jobs/${jobId}` : "/jobs")
      router.refresh()
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred."
      setServerError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 2. Launch Job Handler (Chunk 5)
  const onLaunchJob = async () => {
    setIsLaunching(true)
    setServerError("")

    try {
      const data = getValues()
      const validation = createJobSchema.safeParse(data)

      if (!validation.success) {
        toast.error("Please fill in all required fields accurately before launching.")
        setIsLaunching(false)
        return
      }

      // Step 1: Save/update job data first
      const savedJob = await saveJobData(validation.data)
      const targetJobId = savedJob.id

      // Step 2: Trigger n8n Launch webhook endpoint
      const launchResponse = await fetch(`/api/jobs/${targetJobId}/launch`, {
        method: "POST",
      })

      const launchResult = await launchResponse.json()

      if (launchResult.warning) {
        toast.warning(launchResult.warning, {
          description: "Your job posting has been activated in the database.",
          duration: 6000,
        })
      } else {
        toast.success("Job posted successfully! Automation has started.", {
          description: "Candidates will begin appearing in your pipeline within the next few minutes.",
          duration: 6000,
        })
      }

      router.push(`/jobs/${targetJobId}`)
      router.refresh()
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to launch job automation."
      setServerError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLaunching(false)
    }
  }

  // Extract validation errors for panels
  const sourcingError =
    errors.sourcingConfig?.root?.message ||
    (errors.sourcingConfig?.linkedinEnabled?.message as string | undefined)

  const scoringWeightsError =
    errors.scoringWeights?.root?.message ||
    (errors.scoringWeights?.resumeWeight?.message as string | undefined)

  const isBusy = isSubmitting || isLaunching

  return (
    <form onSubmit={handleSubmit(onSubmitDraft)} className="space-y-8">
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

      {/* Candidate Scoring Weights Panel (Chunk 4) */}
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <div>
          {isEditing && jobId ? (
            <DeleteJobDialog
              jobId={jobId}
              jobTitle={initialJob?.title}
              variant="danger-button"
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(isEditing ? `/jobs/${jobId}` : "/jobs")}
            disabled={isBusy}
            className="border-slate-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
          </Button>

          {/* Save as Draft */}
          <Button
            type="submit"
            variant="outline"
            disabled={isBusy}
            className="border-slate-300 bg-white hover:bg-slate-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
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
                    <Sparkles className="h-4 w-4 text-amber-500" /> Save as Draft
                  </>
                )}
              </span>
            )}
          </Button>

          {/* Launch Job Button (Chunk 5) */}
          <Button
            type="button"
            onClick={onLaunchJob}
            disabled={isBusy}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px] shadow-sm"
          >
            {isLaunching ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Launching...
              </span>
            ) : (
              <span className="flex items-center gap-2 font-semibold">
                <Rocket className="h-4 w-4" /> Launch Job
              </span>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
