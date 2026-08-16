"use client"

import { useState, MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  MoreVertical,
  Pause,
  Play,
  XCircle,
  Users,
  Calendar,
  MapPin,
  Briefcase,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface JobPostingCardData {
  id: string
  title: string
  status: string
  createdAt: string | Date
  experienceLevel: string
  employmentType: string
  location: string
  requiredSkills: string[]
  _count?: {
    candidates: number
  }
}

interface JobCardProps {
  job: JobPostingCardData
  onStatusChange?: (jobId: string, newStatus: string) => void
}

export function JobCard({ job, onStatusChange }: JobCardProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState(job.status)
  const [isLoading, setIsLoading] = useState(false)

  const candidateCount = job._count?.candidates ?? 0

  const handleCardClick = (e: MouseEvent) => {
    // Prevent navigation when clicking interactive dropdown items
    if ((e.target as HTMLElement).closest('[data-slot="dropdown-menu-trigger"]') ||
        (e.target as HTMLElement).closest('[role="menuitem"]')) {
      return
    }
    router.push(`/jobs/${job.id}`)
  }

  const handleStatusAction = async (action: "pause" | "close" | "reopen", e?: MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }

    const previousStatus = currentStatus
    // Optimistic UI update
    const optimisticStatusMap = {
      pause: "paused",
      close: "closed",
      reopen: "active",
    }
    const newOptimisticStatus = optimisticStatusMap[action]
    setCurrentStatus(newOptimisticStatus)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update job status")
      }

      const updatedJob = result.job
      if (updatedJob?.status) {
        setCurrentStatus(updatedJob.status)
      }

      if (onStatusChange && updatedJob?.status) {
        onStatusChange(job.id, updatedJob.status)
      }

      if (result.warning) {
        toast.warning(result.warning, { duration: 5000 })
      } else {
        toast.success(result.message || "Job status updated successfully")
      }

      router.refresh()
    } catch (err: unknown) {
      // Rollback on error
      setCurrentStatus(previousStatus)
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update job status. Please try again."
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Render status badge with color coding
  const renderStatusBadge = () => {
    switch (currentStatus) {
      case "active":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Active
          </Badge>
        )
      case "paused":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1">
            <Pause className="h-3 w-3 text-amber-600" /> Paused
          </Badge>
        )
      case "closed":
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100 px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1">
            <XCircle className="h-3 w-3 text-slate-500" /> Closed
          </Badge>
        )
      case "draft":
      default:
        return (
          <Badge variant="outline" className="border-slate-300 text-slate-600 px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-400" /> Draft
          </Badge>
        )
    }
  }

  // Format date using date-fns
  const formattedDate = format(new Date(job.createdAt), "dd MMM yyyy")

  return (
    <Card
      onClick={handleCardClick}
      className="relative border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden group"
    >
      {/* Loading Overlay */}
      {isLoading ? (
        <div className="absolute inset-0 bg-white/75 backdrop-blur-2xs z-20 flex items-center justify-center gap-2 text-xs font-semibold text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> Updating...
        </div>
      ) : null}

      <CardContent className="p-6 space-y-4">
        {/* Header: Title, Status & Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              {renderStatusBadge()}
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {job.title}
            </h3>
          </div>

          {/* Contextual Action Dropdown */}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors outline-none">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {currentStatus === "active" ? (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => handleStatusAction("pause", e)}
                      className="cursor-pointer text-amber-700 focus:text-amber-800"
                    >
                      <Pause className="h-3.5 w-3.5 mr-2" /> Pause Job
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleStatusAction("close", e)}
                      className="cursor-pointer text-slate-700"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-2" /> Close Job
                    </DropdownMenuItem>
                  </>
                ) : null}

                {currentStatus === "paused" ? (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => handleStatusAction("reopen", e)}
                      className="cursor-pointer text-emerald-700 focus:text-emerald-800 font-medium"
                    >
                      <Play className="h-3.5 w-3.5 mr-2" /> Reopen Job
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleStatusAction("close", e)}
                      className="cursor-pointer text-slate-700"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-2" /> Close Job
                    </DropdownMenuItem>
                  </>
                ) : null}

                {currentStatus === "closed" ? (
                  <DropdownMenuItem
                    onClick={(e) => handleStatusAction("reopen", e)}
                    className="cursor-pointer text-emerald-700 focus:text-emerald-800 font-medium"
                  >
                    <Play className="h-3.5 w-3.5 mr-2" /> Reopen Job
                  </DropdownMenuItem>
                ) : null}

                {currentStatus === "draft" ? (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => handleStatusAction("reopen", e)}
                      className="cursor-pointer text-emerald-700 focus:text-emerald-800 font-medium"
                    >
                      <Play className="h-3.5 w-3.5 mr-2" /> Launch / Activate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleStatusAction("pause", e)}
                      className="cursor-pointer text-amber-700"
                    >
                      <Pause className="h-3.5 w-3.5 mr-2" /> Pause Job
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleStatusAction("close", e)}
                      className="cursor-pointer text-slate-700"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-2" /> Close Job
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Sub-meta details */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {job.location}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
            {job.experienceLevel} Level ({job.employmentType})
          </span>
        </div>

        {/* Footer Meta Row: Candidates Count & Date Created */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
            <Users className="h-3.5 w-3.5 text-indigo-500" />
            <span>{candidateCount} {candidateCount === 1 ? "Candidate" : "Candidates"}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
