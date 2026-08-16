import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus } from "lucide-react"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { JobsListView } from "@/components/jobs/jobs-list-view"

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

  // Format dates for Client Component safety
  const formattedJobs = jobs.map((job) => ({
    ...job,
    createdAt: job.createdAt.toISOString(),
  }))

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              HR Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900 tracking-tight">
              My Job Postings
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your active hiring campaigns, candidate pipelines, and status workflows.
            </p>
          </div>

          <Link href="/jobs/create">
            <Button className="flex items-center gap-2 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4" /> Create New Job
            </Button>
          </Link>
        </div>

        {/* Jobs Grid & Management Component */}
        <JobsListView initialJobs={formattedJobs} />
      </div>
    </main>
  )
}
