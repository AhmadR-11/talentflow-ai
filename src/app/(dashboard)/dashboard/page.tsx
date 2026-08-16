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
} from "lucide-react"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeleteJobDialog } from "@/components/jobs/delete-job-dialog"


export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch job counts and recent jobs for logged in HR manager
  const [totalJobsCount, activeJobsCount, draftJobsCount, totalCandidatesCount, recentJobs] =
    await Promise.all([
      prisma.jobPosting.count({
        where: { hrManagerId: session.user.id },
      }),
      prisma.jobPosting.count({
        where: { hrManagerId: session.user.id, status: "active" },
      }),
      prisma.jobPosting.count({
        where: { hrManagerId: session.user.id, status: "draft" },
      }),
      prisma.candidate.count({
        where: { job: { hrManagerId: session.user.id } },
      }),
      prisma.jobPosting.findMany({
        where: { hrManagerId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          _count: {
            select: { candidates: true },
          },
        },
      }),
    ])

  return (
    <main className="p-6 md:p-10 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-900/10 bg-slate-900 p-8 text-white shadow-md">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-emerald-400 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> HR Command Center
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session.user.name || "HR Manager"}!
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Manage your recruitment pipeline, create new job postings, configure candidate screening, and review AI assessment scores.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href="/jobs/create">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold flex items-center gap-2 shadow-sm">
                <PlusCircle className="h-4 w-4" /> Create New Job
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline" className="border-slate-700 bg-slate-800/60 text-white hover:bg-slate-800">
                View All Job Postings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Jobs */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Jobs
            </CardTitle>
            <Briefcase className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalJobsCount}</div>
            <p className="mt-1 text-xs text-slate-500">All created positions</p>
          </CardContent>
        </Card>

        {/* Active Jobs */}
        <Card className="border-slate-200 shadow-sm">
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

        {/* Draft Jobs */}
        <Card className="border-slate-200 shadow-sm">
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

        {/* Total Candidates */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Candidates
            </CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{totalCandidatesCount}</div>
            <p className="mt-1 text-xs text-slate-500">Applicants evaluated</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Job Postings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Job Postings</h2>
            <p className="text-xs text-slate-500">Your latest created job positions</p>
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
            {recentJobs.map((job) => (
              <Card key={job.id} className="border-slate-200 bg-white transition-all hover:border-slate-300 shadow-sm">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/jobs/${job.id}`} className="font-semibold text-slate-900 hover:underline">
                        {job.title}
                      </Link>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
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
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" /> {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DeleteJobDialog
                      jobId={job.id}
                      jobTitle={job.title}
                      variant="button"
                      redirectOnDelete={false}
                    />
                    <Link href={`/jobs/create?jobId=${job.id}`}>
                      <Button variant="outline" size="sm" className="border-slate-200">
                        Edit Posting
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
