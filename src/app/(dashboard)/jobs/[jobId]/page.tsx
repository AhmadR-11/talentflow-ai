import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Tag,
  Users,
  Calendar,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
} from "lucide-react"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteJobDialog } from "@/components/jobs/delete-job-dialog"


export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { jobId } = await params

  const job = await prisma.jobPosting.findFirst({
    where: {
      id: jobId,
      hrManagerId: session.user.id,
    },
    include: {
      sourcingConfig: true,
      scoringWeights: true,
      _count: {
        select: { candidates: true },
      },
    },
  })

  if (!job) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col gap-2">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Job Postings
          </Link>
        </div>

        {/* Main Job Title & Status Header Card */}
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge
                    variant={
                      job.status === "active"
                        ? "default"
                        : job.status === "draft"
                          ? "secondary"
                          : "outline"
                    }
                    className="capitalize px-3 py-1 text-xs font-bold tracking-wider"
                  >
                    {job.status}
                  </Badge>

                  <span className="text-xs text-slate-400 font-mono">
                    ID: {job.id.slice(0, 8)}...
                  </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {job.title}
                </h1>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {job.location}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    {job.experienceLevel} Level ({job.employmentType})
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Users className="h-4 w-4 text-slate-400" />
                    {job._count?.candidates ?? 0} candidates
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Created {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <DeleteJobDialog
                  jobId={job.id}
                  jobTitle={job.title}
                  variant="button"
                />
                <Link href={`/jobs/create?jobId=${job.id}`}>
                  <Button variant="outline" className="border-slate-300">
                    Edit Posting
                  </Button>
                </Link>
                <Link href="/jobs/create">
                  <Button className="shadow-sm">
                    Create Another Job
                  </Button>
                </Link>
              </div>
            </div>

            {/* Required Skills Section */}
            {job.requiredSkills && job.requiredSkills.length > 0 ? (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400" /> Required Skills
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {job.requiredSkills.map((skill, idx) => (
                    <Badge
                      key={`${skill}-${idx}`}
                      variant="secondary"
                      className="bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800 border border-slate-200/60"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Detailed Grid: Job Description & Configurations */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Job Description */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-slate-600" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {job.description}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Sourcing & Scoring Weights */}
          <div className="space-y-6">
            {/* Candidate Pipeline Summary Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" /> Candidate Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-center">
                  <div className="text-3xl font-bold text-slate-900">
                    {job._count?.candidates ?? 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Total Candidates Sourced</p>
                </div>
              </CardContent>
            </Card>

            {/* Sourcing Platforms Config Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" /> Sourcing Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-800">LinkedIn Sourcing</span>
                  {job.sourcingConfig?.linkedinEnabled ?? true ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active
                    </span>
                  ) : (
                    <span className="text-slate-400">Disabled</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-800">Upwork Sourcing</span>
                  {job.sourcingConfig?.upworkEnabled ?? true ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active
                    </span>
                  ) : (
                    <span className="text-slate-400">Disabled</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-800">Indeed Sourcing</span>
                  {job.sourcingConfig?.indeedEnabled ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active
                    </span>
                  ) : (
                    <span className="text-slate-400">Disabled</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Candidate Scoring Weights Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-slate-600" /> Evaluation Weights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Resume Parsing Score</span>
                    <span className="font-bold text-slate-900">
                      {job.scoringWeights?.resumeWeight ?? 30}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-slate-800 rounded-full"
                      style={{ width: `${job.scoringWeights?.resumeWeight ?? 30}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Assessment Test Score</span>
                    <span className="font-bold text-slate-900">
                      {job.scoringWeights?.testWeight ?? 40}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${job.scoringWeights?.testWeight ?? 40}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>AI Interview Score</span>
                    <span className="font-bold text-slate-900">
                      {job.scoringWeights?.interviewWeight ?? 30}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${job.scoringWeights?.interviewWeight ?? 30}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
