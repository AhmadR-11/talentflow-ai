import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, Briefcase, MapPin, Tag, Users, Calendar } from "lucide-react"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DeleteJobDialog } from "@/components/jobs/delete-job-dialog"


export default async function JobsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

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

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              HR Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900 tracking-tight">
              Job Postings
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your active hiring campaigns, candidate pipelines, and draft positions.
            </p>
          </div>

          <Link href="/jobs/create">
            <Button className="flex items-center gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Create New Job
            </Button>
          </Link>
        </div>

        {/* Job Listings Grid or Empty State */}
        {jobs.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <CardContent className="space-y-4 pt-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Briefcase className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-slate-900">No Job Postings Yet</h3>
                <p className="mx-auto max-w-sm text-sm text-slate-500">
                  Create your first job posting to start sourcing candidates and configuring automated screening assessments.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/jobs/create">
                  <Button className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Create New Job
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="border-slate-200 bg-white transition-all hover:border-slate-300 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-xl font-bold text-slate-900 hover:text-slate-700 transition-colors"
                        >
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
                          className="capitalize px-2.5 py-0.5 text-xs font-semibold"
                        >
                          {job.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {job.location}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                          {job.experienceLevel} ({job.employmentType})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          {job._count?.candidates ?? 0} candidates
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          Created {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Required Skills Badges */}
                      {job.requiredSkills && job.requiredSkills.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <Tag className="h-3 w-3 text-slate-400 mr-1" />
                          {job.requiredSkills.map((skill, i) => (
                            <Badge
                              key={`${skill}-${i}`}
                              variant="outline"
                              className="bg-slate-50 text-[11px] font-medium text-slate-700 border-slate-200"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <DeleteJobDialog
                        jobId={job.id}
                        jobTitle={job.title}
                        variant="button"
                        redirectOnDelete={false}
                      />
                      <Link href={`/jobs/create?jobId=${job.id}`}>
                        <Button variant="outline" size="sm" className="border-slate-300">
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/jobs/${job.id}`}>
                        <Button size="sm" className="shadow-sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
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
