import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Briefcase,
  PlusCircle,
  Users,
  FileCheck2,
  Sparkles,
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteJobDialog } from "@/components/jobs/delete-job-dialog"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch real-time job statistics for the logged-in HR manager
  const jobs = await prisma.jobPosting.findMany({
    where: {
      hrManagerId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: { candidates: true },
      },
    },
  })

  const totalJobsCount = jobs.length
  const activeJobsCount = jobs.filter((j) => j.status === "active").length
  const draftJobsCount = jobs.filter((j) => j.status === "draft").length
  const totalCandidatesCount = jobs.reduce(
    (acc, job) => acc + (job._count?.candidates ?? 0),
    0
  )

  const recentJobs = jobs.slice(0, 5)

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8">
      {/* Welcome Banner Card */}
      <div className="rounded-2xl bg-slate-900 p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-emerald-400 border border-slate-700">
            <Sparkles className="h-3.5 w-3.5" /> HR Command Center
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session.user.name || "HR Manager"}!
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Manage your recruitment pipeline, create new job postings, configure candidate screening, and review AI assessment scores.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href="/jobs/create">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                <PlusCircle className="h-4 w-4 mr-1.5" /> Create New Job
              </Button>
            </Link>
            <Link href="/jobs">
              <Button size="sm" variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
                View All Job Postings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Metric Tiles */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Jobs */}
        <Link href="/jobs" className="block transition-transform hover:-translate-y-0.5">
          <Card className="border-slate-200 shadow-sm hover:border-slate-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Jobs
              </CardTitle>
              <Briefcase className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{totalJobsCount}</div>
              <p className="mt-1 text-xs text-slate-500">All created positions</p>
            </CardContent>
          </Card>
        </Link>

        {/* Active Jobs */}
        <Link href="/jobs?status=active" className="block transition-transform hover:-translate-y-0.5">
          <Card className="border-slate-200 shadow-sm hover:border-emerald-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Postings
              </CardTitle>
              <Sparkles className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{activeJobsCount}</div>
              <p className="mt-1 text-xs text-slate-500">Sourcing candidates</p>
            </CardContent>
          </Card>
        </Link>

        {/* Draft Jobs */}
        <Link href="/jobs?status=draft" className="block transition-transform hover:-translate-y-0.5">
          <Card className="border-slate-200 shadow-sm hover:border-amber-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Draft Postings
              </CardTitle>
              <FileCheck2 className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{draftJobsCount}</div>
              <p className="mt-1 text-xs text-slate-500">In creation pipeline</p>
            </CardContent>
          </Card>
        </Link>

        {/* Total Candidates (Clickable to view candidates) */}
        <Link href="/jobs" className="block transition-transform hover:-translate-y-0.5">
          <Card className="border-indigo-200 bg-indigo-50/30 shadow-sm hover:border-indigo-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                Total Candidates
              </CardTitle>
              <Users className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-700">{totalCandidatesCount}</div>
              <p className="mt-1 text-xs text-indigo-600/80 flex items-center gap-1 font-medium">
                View pipeline candidates <ChevronRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Job Postings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Job Postings</h2>
            <p className="text-xs text-slate-500">Click on any position to view its candidate pipeline</p>
          </div>
          <Link href="/jobs" className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1">
            View all ({totalJobsCount}) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentJobs.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white p-8 text-center">
            <CardContent className="space-y-3 pt-4">
              <Briefcase className="mx-auto h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">No job postings created yet</p>
              <p className="text-xs text-slate-500">Click below to create your first job posting draft.</p>
              <Link href="/jobs/create">
                <Button size="sm" className="mt-2 flex items-center gap-1.5 mx-auto">
                  <PlusCircle className="h-4 w-4" /> Create New Job
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {recentJobs.map((job) => {
              const candidateCount = job._count?.candidates ?? 0

              return (
                <Card key={job.id} className="border-slate-200 bg-white transition-all hover:border-indigo-200 hover:shadow-md">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Link href={`/jobs/${job.id}`} className="font-bold text-base text-slate-900 hover:text-indigo-600 transition-colors">
                          {job.title}
                        </Link>
                        <Badge
                          variant={
                            job.status === "active"
                              ? "default"
                              : job.status === "draft"
                              ? "secondary"
                              : "outline"
                          }
                          className="capitalize text-[10px] font-bold tracking-wider"
                        >
                          {job.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" /> {job.location}
                        </span>
                        <span>•</span>
                        <span>{job.experienceLevel} ({job.employmentType})</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          <Users className="h-3.5 w-3.5 text-indigo-500" /> {candidateCount} {candidateCount === 1 ? "Candidate" : "Candidates"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="h-3.5 w-3.5" /> {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <DeleteJobDialog
                        jobId={job.id}
                        jobTitle={job.title}
                        variant="button"
                        redirectOnDelete={false}
                      />
                      <Link href={`/jobs/${job.id}`}>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs">
                          <Users className="h-3.5 w-3.5 mr-1.5" /> View Candidates
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
