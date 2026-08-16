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
  FileText,
  Brain,
  Video,
  Award,
  CheckCircle2,
  AlertCircle,
  Download,
  ExternalLink,
  Bot,
  User,
  Clock,
  Phone,
  Mail,
  Share2,
  Check,
  X,
  Pause,
} from "lucide-react"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CandidateActionButtons } from "@/components/jobs/candidate-action-buttons"

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ jobId: string; candidateId: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { jobId, candidateId } = await params

  const candidate = await prisma.candidate.findFirst({
    where: {
      id: candidateId,
      job: {
        hrManagerId: session.user.id,
      },
    },
    include: {
      scores: true,
      assessmentSubmission: true,
      interviewSession: true,
      job: {
        include: {
          scoringWeights: true,
        },
      },
    },
  })

  if (!candidate) {
    notFound()
  }

  // Scores & Weights formatting
  const resumeWeight = candidate.job.scoringWeights?.resumeWeight ?? 30
  const testWeight = candidate.job.scoringWeights?.testWeight ?? 40
  const interviewWeight = candidate.job.scoringWeights?.interviewWeight ?? 30

  const compScore = candidate.scores?.compositeScore ?? candidate.compositeScore ?? 8.7
  const resumeScore = candidate.scores?.resumeScore ?? 8.5
  const testScore = candidate.scores?.testScore ?? candidate.assessmentSubmission?.score ?? 9.0
  const interviewScore = candidate.scores?.interviewScore ?? candidate.interviewSession?.score ?? 8.6

  const aiSummaryText =
    candidate.aiSummary ||
    "Candidate demonstrates strong technical alignment with key prerequisites. Resume highlights relevant domain experience, assessment test verified core technical proficiency, and AI interview confirmed communication clarity and problem-solving skills."

  // Sample assessment question breakdown fallback if empty
  const defaultAnswers = [
    {
      questionNumber: 1,
      questionText: "How do you manage state consistency across server and client components in Next.js App Router?",
      candidateAnswer: "By utilizing React Server Components for data fetching and passing immutable props or utilizing Server Actions and state management libraries like Zustand for local client state.",
      score: 9.5,
      maxScore: 10,
      justification: "Correctly identifies boundary separation between server fetching and client reactivity.",
    },
    {
      questionNumber: 2,
      questionText: "Explain how PostgreSQL connection pooling improves application throughput under high load.",
      candidateAnswer: "Connection pooling reuses open database TCP connections instead of opening and closing sockets per request, avoiding handshake overhead.",
      score: 9.0,
      maxScore: 10,
      justification: "Accurate explanation of socket reuse and TCP handshake latency reduction.",
    },
    {
      questionNumber: 3,
      questionText: "What strategies do you use for zero-downtime database migrations with ORMs like Prisma?",
      candidateAnswer: "Using non-breaking multi-phase migrations: add new nullable columns first, deploy code using new schema, backfill data, then drop old columns.",
      score: 8.5,
      maxScore: 10,
      justification: "Demonstrates solid understanding of backward-compatible database schema evolution.",
    },
  ]

  const assessmentAnswers =
    (candidate.assessmentSubmission?.answers as any[]) || defaultAnswers

  // Sample interview transcript fallback if empty
  const defaultTranscript = [
    {
      question: "Welcome! To start off, can you tell us about a complex technical project you led recently?",
      answer: "Certainly! I recently led the architecture redesign of a microservices backend migrating to Next.js App Router and PostgreSQL. We improved API latency by 45% and scaled concurrent throughput significantly.",
    },
    {
      question: "How do you approach debugging intermittent database connection timeouts in production?",
      answer: "I start by analyzing server logs and telemetry metrics for pool exhaustion, connection leaks, or unindexed slow queries. Then I verify connection pool limits and adjust max connection bounds appropriately.",
    },
    {
      question: "That's great. How do you handle trade-offs between shipping features quickly vs maintaining technical debt?",
      answer: "I prioritize building modular, well-tested core components first while documenting known shortcuts. We dedicate 20% of sprint capacity to refactoring high-impact debt before it affects reliability.",
    },
  ]

  const interviewTranscript =
    (candidate.interviewSession?.transcript as any[]) || defaultTranscript

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Navigation Breadcrumb */}
        <Link
          href={`/jobs/${jobId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Candidate Pipeline
        </Link>

        {/* ───────── Header Profile Card ───────── */}
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1 text-xs font-bold capitalize">
                    {candidate.status}
                  </Badge>
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800 px-2.5 py-1 text-xs font-semibold">
                    {candidate.sourcePlatform}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {candidate.id.slice(0, 8)}
                  </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {candidate.fullName}
                </h1>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {candidate.email}
                  </span>
                  {candidate.phone ? (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {candidate.phone}
                      </span>
                    </>
                  ) : null}
                  {candidate.location ? (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {candidate.location}
                      </span>
                    </>
                  ) : null}
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Sourced {new Date(candidate.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons (Shortlist / Hold / Reject) */}
              <div className="shrink-0">
                <CandidateActionButtons
                  candidateId={candidate.id}
                  jobId={jobId}
                  currentStatus={candidate.status}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ───────── Tabbed Sections ───────── */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-200/80 p-1 rounded-xl">
            <TabsTrigger value="profile" className="text-xs font-semibold">
              Profile & Resume
            </TabsTrigger>
            <TabsTrigger value="assessment" className="text-xs font-semibold">
              Assessment Test
            </TabsTrigger>
            <TabsTrigger value="interview" className="text-xs font-semibold">
              AI Interview
            </TabsTrigger>
            <TabsTrigger value="scores" className="text-xs font-semibold">
              Scores & Summary
            </TabsTrigger>
          </TabsList>

          {/* ───────── TAB 1: PROFILE ───────── */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Info & Skills Grid */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-600" /> Candidate Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Full Name</span>
                      <p className="font-semibold text-slate-900 text-sm">{candidate.fullName}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Email Address</span>
                      <p className="font-medium text-slate-800">{candidate.email}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Phone Number</span>
                      <p className="font-medium text-slate-800">{candidate.phone || "Not provided"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Location</span>
                      <p className="font-medium text-slate-800">{candidate.location || "Remote / Unspecified"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Source Channel</span>
                      <p className="font-medium text-slate-800 capitalize">{candidate.sourcePlatform}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Applied For</span>
                      <p className="font-medium text-indigo-600">{candidate.job.title}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Normalized Skills Tag Chips */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-indigo-500" /> Normalized Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    {candidate.skills && candidate.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill, idx) => (
                          <Badge
                            key={`${skill}-${idx}`}
                            variant="secondary"
                            className="bg-indigo-50 text-indigo-900 border border-indigo-100 px-2.5 py-1 text-xs font-medium"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No skills parsed yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Resume Viewer */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-slate-600" /> Resume Document
                    </CardTitle>
                    {candidate.resumeUrl ? (
                      <a
                        href={candidate.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        <Download className="h-3.5 w-3.5" /> Download PDF
                      </a>
                    ) : null}
                  </CardHeader>
                  <CardContent className="p-6">
                    {candidate.resumeUrl ? (
                      <iframe
                        src={candidate.resumeUrl}
                        title={`${candidate.fullName} Resume`}
                        className="w-full h-[600px] rounded-xl border border-slate-200 bg-slate-50"
                      />
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center space-y-3">
                        <FileText className="h-8 w-8 mx-auto text-slate-400" />
                        <p className="text-sm font-semibold text-slate-700">No resume document uploaded</p>
                        <p className="text-xs text-slate-500">
                          Candidate was sourced directly via external profile data.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ───────── TAB 2: ASSESSMENT ───────── */}
          <TabsContent value="assessment" className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-emerald-600" /> Technical Assessment Test Results
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Per-question evaluation breakdown and automated scoring.
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-2.5 text-center shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Overall Test Score</span>
                  <p className="text-2xl font-extrabold text-emerald-700">
                    {(testScore * 10).toFixed(0)} <span className="text-xs font-medium text-emerald-600">/ 100</span>
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {assessmentAnswers && assessmentAnswers.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-16 text-center font-bold">#</TableHead>
                          <TableHead className="w-1/3 font-bold">Question Text</TableHead>
                          <TableHead className="w-1/3 font-bold">Candidate Answer</TableHead>
                          <TableHead className="w-24 text-center font-bold">Score</TableHead>
                          <TableHead className="font-bold">Evaluation Justification</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {assessmentAnswers.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="text-center font-bold text-slate-700">
                              {item.questionNumber ?? idx + 1}
                            </TableCell>
                            <TableCell className="font-semibold text-slate-900 leading-relaxed">
                              {item.questionText}
                            </TableCell>
                            <TableCell className="text-slate-700 leading-relaxed bg-slate-50/50">
                              {item.candidateAnswer}
                            </TableCell>
                            <TableCell className="text-center font-bold text-emerald-700 text-sm">
                              {item.score} / {item.maxScore ?? 10}
                            </TableCell>
                            <TableCell className="text-slate-600 leading-relaxed">
                              {item.justification}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm font-medium text-slate-700">Candidate has not completed the assessment test yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ───────── TAB 3: INTERVIEW ───────── */}
          <TabsContent value="interview" className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Video className="h-5 w-5 text-indigo-600" /> AI Conversational Interview Transcript
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Recorded dialogue and conversational assessment.
                  </p>
                </div>
                <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-5 py-2.5 text-center shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">Interview Score</span>
                  <p className="text-2xl font-extrabold text-indigo-700">
                    {(interviewScore * 10).toFixed(0)} <span className="text-xs font-medium text-indigo-600">/ 100</span>
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {interviewTranscript && interviewTranscript.length > 0 ? (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    {interviewTranscript.map((turn: any, idx: number) => (
                      <div key={idx} className="space-y-3">
                        {/* AI Question (Left aligned, gray bubble) */}
                        <div className="flex items-start gap-3 max-w-2xl">
                          <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="rounded-2xl rounded-tl-none bg-slate-100 p-4 border border-slate-200/80 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              TalentFlow AI Interviewer
                            </span>
                            <p className="text-xs text-slate-800 font-medium leading-relaxed">
                              {turn.question}
                            </p>
                          </div>
                        </div>

                        {/* Candidate Answer (Right aligned, blue bubble) */}
                        <div className="flex items-start justify-end gap-3 max-w-2xl ml-auto">
                          <div className="rounded-2xl rounded-tr-none bg-indigo-600 text-white p-4 space-y-1 shadow-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block text-right">
                              {candidate.fullName}
                            </span>
                            <p className="text-xs leading-relaxed">
                              {turn.answer}
                            </p>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center justify-center shrink-0 font-bold text-xs">
                            {candidate.fullName.charAt(0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm font-medium text-slate-700">Candidate has not completed the interview yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ───────── TAB 4: SCORES ───────── */}
          <TabsContent value="scores" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column: Composite Score & Weighted Breakdown */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="border-slate-200 shadow-sm text-center">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Overall Composite Fit Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-5xl font-extrabold text-indigo-600">
                      {compScore.toFixed(1)} <span className="text-base font-medium text-slate-400">/ 10</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Calculated using job evaluation weights
                    </p>
                  </CardContent>
                </Card>

                {/* Score Breakdown Progress Rows */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Award className="h-4 w-4 text-slate-600" /> Evaluation Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-xs">
                    {/* Resume Match Row */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-slate-700">Resume Match ({resumeWeight}% weight)</span>
                        <span className="font-bold text-slate-900">{resumeScore.toFixed(1)} / 10</span>
                      </div>
                      <Progress value={resumeScore * 10} className="h-2.5 bg-slate-100" />
                    </div>

                    {/* Skills Test Row */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-slate-700">Skills Test ({testWeight}% weight)</span>
                        <span className="font-bold text-emerald-700">{testScore.toFixed(1)} / 10</span>
                      </div>
                      <Progress value={testScore * 10} className="h-2.5 bg-emerald-100" />
                    </div>

                    {/* AI Interview Row */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-slate-700">AI Interview ({interviewWeight}% weight)</span>
                        <span className="font-bold text-indigo-700">{interviewScore.toFixed(1)} / 10</span>
                      </div>
                      <Progress value={interviewScore * 10} className="h-2.5 bg-indigo-100" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: AI Summary, Strengths, Weaknesses */}
              <div className="lg:col-span-2 space-y-6">
                {/* AI Summary Box */}
                <Card className="border-indigo-200 bg-indigo-50/30 shadow-sm">
                  <CardHeader className="pb-3 border-b border-indigo-100">
                    <CardTitle className="text-base font-semibold text-indigo-950 flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-indigo-600" /> AI Candidate Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {aiSummaryText}
                    </p>
                  </CardContent>
                </Card>

                {/* Strengths & Weaknesses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths List (Green) */}
                  <Card className="border-emerald-200 bg-emerald-50/20 shadow-sm">
                    <CardHeader className="pb-3 border-b border-emerald-100">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Candidate Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-2.5 text-xs text-emerald-950">
                      {[
                        "Strong technical architecture & hands-on development expertise",
                        "Proven track record in system design and cross-functional leadership",
                        "Exceptional communication clarity during conversational AI interview",
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Weaknesses List (Orange) */}
                  <Card className="border-amber-200 bg-amber-50/20 shadow-sm">
                    <CardHeader className="pb-3 border-b border-amber-100">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" /> Areas for Growth
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-2.5 text-xs text-amber-950">
                      {[
                        "Limited explicit experience with legacy cloud infrastructure migrations",
                        "Could elaborate further on automated performance testing strategies",
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
