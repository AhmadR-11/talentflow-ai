import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Sparkles } from "lucide-react"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { CreateJobForm } from "@/components/jobs/create-job-form"
import { Badge } from "@/components/ui/badge"

export default async function CreateJobPage({
  searchParams,
}: {
  searchParams?: Promise<{ jobId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const resolvedParams = searchParams ? await searchParams : undefined
  const jobId = resolvedParams?.jobId

  let initialJob = null
  if (jobId) {
    initialJob = await prisma.jobPosting.findFirst({
      where: {
        id: jobId,
        hrManagerId: session.user.id,
      },
      include: {
        sourcingConfig: true,
        scoringWeights: true,
      },
    })
  }

  const isEditing = !!initialJob

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col gap-2">
          <Link
            href={initialJob ? `/jobs/${initialJob.id}` : "/jobs"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />{" "}
            {initialJob ? "Back to Job Details" : "Back to Job Postings"}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {initialJob ? "Edit Job Posting" : "Create New Job"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {initialJob
                  ? "Update posting details, requirements, sourcing channels, and evaluation weights."
                  : "Define posting details, requirements, and skill prerequisites for candidate evaluation."}
              </p>
            </div>
            {initialJob ? (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                Status:{" "}
                <Badge
                  variant={initialJob.status === "active" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {initialJob.status}
                </Badge>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Default Status: <span className="font-semibold text-slate-900">Draft</span>
              </div>
            )}
          </div>
        </div>

        {/* Job Creation/Edit Form Component */}
        <CreateJobForm initialJob={initialJob} jobId={initialJob?.id} />
      </div>
    </main>
  )
}

