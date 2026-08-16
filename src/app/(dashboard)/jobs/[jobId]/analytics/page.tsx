"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Download,
  BarChart3,
  TrendingUp,
  Award,
  Clock,
  AlertTriangle,
  Sparkles,
  Users,
  CheckCircle2,
  PieChart as PieIcon,
  ChevronRight,
  Loader2,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface AnalyticsData {
  job: {
    id: string
    title: string
  }
  funnel: {
    total_sourced: number
    screened: number
    interviewed: number
    shortlisted: number
    rejected: number
  }
  conversion: {
    sourcedToScreened: number
    screenedToInterviewed: number
    interviewedToShortlisted: number
    overallShortlistRate: number
  }
  scores: {
    avgScore: number
    highestScore: number
    lowestScore: number
  }
  sourcePerformance: Array<{
    source_platform: string
    avg_score: number
    total: number
  }>
  bestPerformingSource: string
  topMissingSkills: Array<{
    skill: string
    missingCount: number
    missingPercentage: number
  }>
  avgHoursToShortlist: number
}

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = use(params)

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/analytics/${jobId}`)
        const result = await res.json()

        if (!res.ok || !result.success) {
          throw new Error(result.error || "Failed to load analytics")
        }

        setData(result)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load analytics"
        toast.error(msg)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [jobId])

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      window.location.href = `/api/analytics/${jobId}/export`
      toast.success("CSV export initiated successfully.")
    } catch (err) {
      toast.error("Failed to export CSV.")
    } finally {
      setTimeout(() => setIsExporting(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-6 w-48" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    )
  }

  if (!data || data.funnel.total_sourced === 0) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <Link
            href={`/jobs/${jobId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Job Details
          </Link>

          <Card className="border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
            <CardContent className="space-y-3 pt-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Not Enough Data to Generate Analytics</h3>
              <p className="mx-auto max-w-md text-xs text-slate-500">
                Check back once candidates have been sourced and evaluated for this position.
              </p>
              <Link href={`/jobs/${jobId}`}>
                <Button size="sm" className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                  Return to Job Pipeline
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Chart Color mapping for Source Performance
  const COLORS = ["#4F46E5", "#10B981", "#F97316", "#64748B"]

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link
            href={`/jobs/${jobId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Job Details
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
                <BarChart3 className="h-4 w-4" /> Performance Reporting
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
                Analytics — {data.job.title}
              </h1>
            </div>

            <Button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-4 shadow-xs"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export as CSV
            </Button>
          </div>
        </div>

        {/* ───────── Section 1: Recruitment Funnel ───────── */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-600" /> Recruitment Funnel Breakdown
              </span>
              <Badge variant="outline" className="text-xs border-indigo-200 bg-indigo-50 text-indigo-800">
                Overall Shortlist Conversion: {data.conversion.overallShortlistRate}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              {/* Stage 1: Sourced */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">1. Sourced</span>
                <p className="text-3xl font-extrabold text-slate-900">{data.funnel.total_sourced}</p>
                <p className="text-[11px] text-slate-500">100% of candidates</p>
              </div>

              {/* Stage 2: Screened */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">2. Screened</span>
                <p className="text-3xl font-extrabold text-blue-700">{data.funnel.screened}</p>
                <p className="text-[11px] text-blue-600 font-medium">
                  {data.conversion.sourcedToScreened}% conversion
                </p>
              </div>

              {/* Stage 3: Interviewed */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-2 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">3. Interviewed</span>
                <p className="text-3xl font-extrabold text-purple-700">{data.funnel.interviewed}</p>
                <p className="text-[11px] text-purple-600 font-medium">
                  {data.conversion.screenedToInterviewed}% conversion
                </p>
              </div>

              {/* Stage 4: Shortlisted */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">4. Shortlisted</span>
                <p className="text-3xl font-extrabold text-emerald-700">{data.funnel.shortlisted}</p>
                <p className="text-[11px] text-emerald-600 font-medium">
                  {data.conversion.interviewedToShortlisted}% conversion
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ───────── Section 2: Score Overview ───────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 bg-white shadow-sm text-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Average Composite Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-extrabold text-indigo-600">{data.scores.avgScore.toFixed(1)}</p>
              <p className="text-xs text-slate-400 mt-1">Out of 10.0 max</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm text-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Highest Candidate Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-extrabold text-emerald-600">{data.scores.highestScore.toFixed(1)}</p>
              <p className="text-xs text-slate-400 mt-1">Top candidate match</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm text-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lowest Candidate Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-extrabold text-slate-700">{data.scores.lowestScore.toFixed(1)}</p>
              <p className="text-xs text-slate-400 mt-1">Lowest evaluated score</p>
            </CardContent>
          </Card>
        </div>

        {/* ───────── Section 3 & Section 5 Grid ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section 3: Source Performance Chart */}
          <Card className="lg:col-span-2 border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <PieIcon className="h-4.5 w-4.5 text-indigo-600" /> Source Platform Performance
              </CardTitle>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold">
                Best Channel: {data.bestPerformingSource}
              </Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sourcePerformance} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="source_platform" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1E293B", borderRadius: "8px", border: "none", color: "#FFF" }}
                    />
                    <Bar dataKey="avg_score" name="Avg Composite Score" radius={[6, 6, 0, 0]}>
                      {data.sourcePerformance.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.source_platform === data.bestPerformingSource ? "#10B981" : COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Time Metrics */}
          <Card className="border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-amber-500" /> Time to Shortlist
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center space-y-4 my-auto">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                <Clock className="h-8 w-8" />
              </div>
              <div>
                <p className="text-4xl font-extrabold text-slate-900">
                  {data.avgHoursToShortlist} <span className="text-lg font-medium text-slate-500">hours</span>
                </p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Average elapsed time from initial candidate sourcing to HR manager shortlist action.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ───────── Section 4: Skill Gap Analysis ───────── */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-orange-500" /> Top Missing Skills — Based on JD Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {data.topMissingSkills && data.topMissingSkills.length > 0 ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-bold">Required Skill Name</TableHead>
                      <TableHead className="w-32 text-center font-bold">Missing Count</TableHead>
                      <TableHead className="w-1/3 font-bold">% of Candidates Missing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {data.topMissingSkills.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-bold text-slate-900">{item.skill}</TableCell>
                        <TableCell className="text-center font-bold text-slate-700">
                          {item.missingCount} / {data.funnel.total_sourced}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-orange-700">
                              <span>{item.missingPercentage}% missing</span>
                            </div>
                            <Progress value={item.missingPercentage} className="h-2 bg-slate-100" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                All candidates possess the required skills specified in the job description!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
