"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Users,
  Filter,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  UserCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Loader2,
  Building2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ActionButtons } from "@/components/jobs/action-buttons"

export interface CandidateScoresData {
  compositeScore: number
  resumeScore: number
  testScore: number
  interviewScore: number
  aiSummary: string
}

export interface CandidatePipelineItem {
  id: string
  fullName: string
  email: string
  phone?: string | null
  location?: string | null
  sourcePlatform: string
  status: string
  createdAt: string
  scores: CandidateScoresData
}

export interface PipelineStats {
  total: number
  sourced: number
  screened: number
  interviewed: number
  shortlisted: number
  rejected: number
}

interface CandidatePipelineDashboardProps {
  jobId: string
  jobTitle: string
}

export function CandidatePipelineDashboard({
  jobId,
  jobTitle,
}: CandidatePipelineDashboardProps) {
  const [candidates, setCandidates] = useState<CandidatePipelineItem[]>([])
  const [stats, setStats] = useState<PipelineStats>({
    total: 0,
    sourced: 0,
    screened: 0,
    interviewed: 0,
    shortlisted: 0,
    rejected: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Filter States
  const [minScore, setMinScore] = useState<string>("")
  const [maxScore, setMaxScore] = useState<string>("")
  const [source, setSource] = useState<string>("all")
  const [stage, setStage] = useState<string>("all")

  // Applied Filter values for API calls
  const [appliedFilters, setAppliedFilters] = useState({
    minScore: "",
    maxScore: "",
    source: "all",
    stage: "all",
  })

  const fetchCandidates = useCallback(
    async (targetPage: number, append = false) => {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      try {
        const queryParams = new URLSearchParams()
        queryParams.set("page", targetPage.toString())
        queryParams.set("limit", "10")

        if (appliedFilters.minScore) queryParams.set("minScore", appliedFilters.minScore)
        if (appliedFilters.maxScore) queryParams.set("maxScore", appliedFilters.maxScore)
        if (appliedFilters.source && appliedFilters.source !== "all") {
          queryParams.set("source", appliedFilters.source)
        }
        if (appliedFilters.stage && appliedFilters.stage !== "all") {
          queryParams.set("stage", appliedFilters.stage)
        }

        const response = await fetch(`/api/jobs/${jobId}/candidates?${queryParams.toString()}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to load candidate pipeline")
        }

        if (append) {
          setCandidates((prev) => [...prev, ...result.candidates])
        } else {
          setCandidates(result.candidates)
        }

        setStats(result.stats || {
          total: 0,
          sourced: 0,
          screened: 0,
          interviewed: 0,
          shortlisted: 0,
          rejected: 0,
        })
        setTotalPages(result.totalPages || 1)
        setTotalCount(result.total || 0)
        setPage(targetPage)
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load candidate pipeline."
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [jobId, appliedFilters]
  )

  useEffect(() => {
    fetchCandidates(1, false)
  }, [fetchCandidates])

  const handleApplyFilters = () => {
    setAppliedFilters({ minScore, maxScore, source, stage })
  }

  const handleResetFilters = () => {
    setMinScore("")
    setMaxScore("")
    setSource("all")
    setStage("all")
    setAppliedFilters({ minScore: "", maxScore: "", source: "all", stage: "all" })
  }

  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      fetchCandidates(page + 1, true)
    }
  }

  // Badge helpers
  const renderSourceBadge = (platform: string) => {
    const p = platform.toLowerCase()
    if (p.includes("linkedin")) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 px-2.5 py-0.5 text-xs font-semibold">
          LinkedIn
        </Badge>
      )
    }
    if (p.includes("upwork")) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold">
          Upwork
        </Badge>
      )
    }
    if (p.includes("indeed")) {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100 px-2.5 py-0.5 text-xs font-semibold">
          Indeed
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-slate-600 border-slate-300 px-2.5 py-0.5 text-xs font-semibold capitalize">
        {platform}
      </Badge>
    )
  }

  const renderStageBadge = (status: string) => {
    const s = status.toLowerCase()
    switch (s) {
      case "sourced":
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100 px-2.5 py-0.5 text-xs font-semibold capitalize">
            Sourced
          </Badge>
        )
      case "screened":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 px-2.5 py-0.5 text-xs font-semibold capitalize">
            Screened
          </Badge>
        )
      case "interviewed":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 px-2.5 py-0.5 text-xs font-semibold capitalize">
            Interviewed
          </Badge>
        )
      case "shortlisted":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold capitalize">
            Shortlisted
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 px-2.5 py-0.5 text-xs font-semibold capitalize">
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="capitalize px-2.5 py-0.5 text-xs font-semibold">
            {status}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-8">
      {/* ───────── Top Section Header ───────── */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
          <Sparkles className="h-4 w-4" /> AI Automated Screening
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
          Candidate Pipeline
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Candidates automatically sourced and ranked by composite score for <span className="font-semibold text-slate-800">{jobTitle}</span>.
        </p>
      </div>

      {/* ───────── Stats Bar (4 Metric Cards) ───────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* 1. Total Sourced */}
        <Card className="border-slate-200 bg-white shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Sourced
              </p>
              <p className="text-2xl font-bold text-slate-900">{stats.sourced || stats.total}</p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Screened */}
        <Card className="border-slate-200 bg-white shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 border border-blue-100">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Screened
              </p>
              <p className="text-2xl font-bold text-blue-700">{stats.screened}</p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Shortlisted */}
        <Card className="border-slate-200 bg-white shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Shortlisted
              </p>
              <p className="text-2xl font-bold text-emerald-700">{stats.shortlisted}</p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Rejected */}
        <Card className="border-slate-200 bg-white shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="rounded-xl bg-red-50 p-3 text-red-600 border border-red-100">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Rejected
              </p>
              <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ───────── Filter Bar ───────── */}
      <Card className="border-slate-200 bg-white shadow-2xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-indigo-500" /> Candidate Search & Filter
            </h3>
            {(minScore || maxScore || source !== "all" || stage !== "all") ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset Filters
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Score Range Inputs */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Score Range (0 - 10)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  min={0}
                  max={10}
                  step={0.5}
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                  className="h-9 text-xs"
                />
                <span className="text-slate-400 text-xs">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  min={0}
                  max={10}
                  step={0.5}
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Source Platform Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Source Platform
              </label>
              <Select value={source} onValueChange={(val) => setSource(val ?? "all")}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="upwork">Upwork</SelectItem>
                  <SelectItem value="indeed">Indeed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stage Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Pipeline Stage
              </label>
              <Select value={stage} onValueChange={(val) => setStage(val ?? "all")}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="sourced">Sourced</SelectItem>
                  <SelectItem value="screened">Screened</SelectItem>
                  <SelectItem value="interviewed">Interviewed</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Apply & Reset Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleApplyFilters}
                className="h-9 flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Apply Filters
              </Button>
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="h-9 text-xs border-slate-300"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ───────── Candidate Cards List ───────── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="border-slate-200 p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
          <CardContent className="space-y-3 pt-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Candidates Sourced Yet</h3>
              <p className="mx-auto max-w-md text-xs text-slate-500">
                No candidates matched your filter criteria or sourcing automation is running. Candidates will begin appearing shortly.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => {
            const compScore = candidate.scores.compositeScore
            const scorePercentage = Math.min(100, Math.max(0, compScore * 10))

            return (
              <Card
                key={candidate.id}
                className="border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Card Header: Name, Source Badge, Stage Badge */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-lg font-bold text-slate-900">
                          {candidate.fullName}
                        </h4>
                        {renderSourceBadge(candidate.sourcePlatform)}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{candidate.email}</span>
                        {candidate.location ? <span>• {candidate.location}</span> : null}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {renderStageBadge(candidate.status)}
                      <ActionButtons
                        candidateId={candidate.id}
                        candidateName={candidate.fullName}
                        jobId={jobId}
                        currentStatus={candidate.status}
                        variant="compact"
                        onActionComplete={(newStatus) => {
                          setCandidates((prev) =>
                            prev.map((c) =>
                              c.id === candidate.id ? { ...c, status: newStatus } : c
                            )
                          )
                        }}
                      />
                      <Link href={`/jobs/${jobId}/candidates/${candidate.id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs border-slate-300">
                          View Profile <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Composite Score Bar */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-indigo-600" /> Composite Fit Score
                      </span>
                      <span className="text-sm font-bold text-indigo-700">
                        {compScore.toFixed(1)} <span className="text-xs font-normal text-slate-500">/ 10</span>
                      </span>
                    </div>

                    <Progress value={scorePercentage} className="h-2 bg-slate-200" />
                  </div>

                  {/* AI Summary */}
                  <div className="rounded-lg bg-indigo-50/40 p-3.5 border border-indigo-100/70 text-xs leading-relaxed text-slate-700">
                    <p className="font-semibold text-indigo-900 flex items-center gap-1.5 mb-1 text-[11px]">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> AI Candidate Evaluation Summary
                    </p>
                    <p className="text-slate-600 line-clamp-3">
                      {candidate.scores.aiSummary}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Pagination Controls */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 border-t border-slate-200">
            <div>
              Showing <span className="font-semibold text-slate-800">{candidates.length}</span> of{" "}
              <span className="font-semibold text-slate-800">{totalCount}</span> candidates
            </div>

            {page < totalPages ? (
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="h-9 text-xs border-slate-300"
              >
                {isLoadingMore ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
                  </span>
                ) : (
                  "Load More Candidates"
                )}
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
