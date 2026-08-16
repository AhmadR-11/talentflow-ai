"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Briefcase, Search, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { JobCard, JobPostingCardData } from "@/components/jobs/job-card"

interface JobsListViewProps {
  initialJobs: JobPostingCardData[]
}

const FILTER_TABS = [
  { key: "all", label: "All Postings" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
  { key: "closed", label: "Closed" },
  { key: "draft", label: "Drafts" },
]

export function JobsListView({ initialJobs }: JobsListViewProps) {
  const [jobs, setJobs] = useState<JobPostingCardData[]>(initialJobs)
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const handleStatusChange = (jobId: string, newStatus: string) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => (job.id === jobId ? { ...job, status: newStatus } : job))
    )
  }

  // Filter jobs based on selected tab and search term
  const filteredJobs = jobs.filter((job) => {
    const matchesFilter = activeFilter === "all" ? true : job.status === activeFilter
    const matchesSearch =
      searchQuery.trim() === "" ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Status counts for badge counters
  const counts = {
    all: jobs.length,
    active: jobs.filter((j) => j.status === "active").length,
    paused: jobs.filter((j) => j.status === "paused").length,
    closed: jobs.filter((j) => j.status === "closed").length,
    draft: jobs.filter((j) => j.status === "draft").length,
  }

  return (
    <div className="space-y-6">
      {/* Search Bar & Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {FILTER_TABS.map((tab) => {
            const isSelected = activeFilter === tab.key
            const count = counts[tab.key as keyof typeof counts] ?? 0

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search jobs or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9 bg-slate-50 border-slate-200 focus-visible:bg-white"
          />
        </div>
      </div>

      {/* Grid of Job Cards or Empty State */}
      {filteredJobs.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
          <CardContent className="space-y-4 pt-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                {jobs.length === 0 ? "No Job Postings Yet" : "No Matching Jobs Found"}
              </h3>
              <p className="mx-auto max-w-sm text-xs text-slate-500">
                {jobs.length === 0
                  ? "Create your first job posting to start sourcing candidates."
                  : "Try clearing your search query or switching status filters."}
              </p>
            </div>
            {jobs.length === 0 ? (
              <div className="pt-2">
                <Link href="/jobs/create">
                  <Button size="sm" className="inline-flex items-center gap-1.5 shadow-sm">
                    <Plus className="h-4 w-4" /> Create New Job
                  </Button>
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}
