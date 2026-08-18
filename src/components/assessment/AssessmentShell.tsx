"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  FileCode2,
  ListChecks,
  MessageSquareText,
  HelpCircle,
} from "lucide-react"
import { toast } from "sonner"

import { AssessmentData, MCQQuestion, ShortAnswerQuestion, PracticalQuestion } from "@/app/api/assessment/[token]/route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AssessmentShellProps {
  token: string
  candidate: {
    id: string
    fullName: string
    email: string
    jobId: string
  }
  job: {
    title: string
    requiredSkills: string[]
    experienceLevel: string
  }
  assessment: AssessmentData
}

export function AssessmentShell({ token, candidate, job, assessment }: AssessmentShellProps) {
  const router = useRouter()

  const mcqSection = assessment.sections?.find((s) => s.type === "mcq")
  const mcqQuestions = (mcqSection?.questions || []) as MCQQuestion[]

  const shortAnswerSection = assessment.sections?.find((s) => s.type === "short_answer")
  const shortAnswerQuestions = (shortAnswerSection?.questions || []) as ShortAnswerQuestion[]

  const practicalSection = assessment.sections?.find((s) => s.type === "practical")
  const practicalQuestions = (practicalSection?.questions || []) as PracticalQuestion[]

  const initialSeconds = (assessment.timeLimitMinutes || 45) * 60

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState<number>(initialSeconds)
  const [currentSection, setCurrentSection] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState<boolean>(false)
  const [submitAttempted, setSubmitAttempted] = useState<boolean>(false)

  const timerStorageKey = `tf_timer_${token}`
  const answersStorageKey = `tf_answers_${token}`

  // Restore saved state from localStorage on mount
  useEffect(() => {
    try {
      const savedTimer = localStorage.getItem(timerStorageKey)
      if (savedTimer) {
        const parsed = parseInt(savedTimer, 10)
        if (!isNaN(parsed) && parsed > 0) {
          setTimeRemaining(parsed)
        }
      }

      const savedAnswers = localStorage.getItem(answersStorageKey)
      if (savedAnswers) {
        const parsedAnswers = JSON.parse(savedAnswers)
        if (parsedAnswers && typeof parsedAnswers === "object") {
          setAnswers(parsedAnswers)
        }
      }
    } catch (e) {
      console.warn("Failed to restore assessment session from localStorage:", e)
    }
  }, [timerStorageKey, answersStorageKey])

  // Count answered MCQs
  const answeredMcqCount = mcqQuestions.filter((q) => answers[q.questionId]?.trim()).length
  const isMcqComplete = answeredMcqCount >= mcqQuestions.length && mcqQuestions.length > 0

  // Count answered short answer & practical
  const answeredShortCount = shortAnswerQuestions.filter((q) => answers[q.questionId]?.trim()).length
  const answeredPracticalCount = practicalQuestions.filter((q) => answers[q.questionId]?.trim()).length

  // Auto-submit logic
  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/assessment/${token}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Clear local storage
        localStorage.removeItem(timerStorageKey)
        localStorage.removeItem(answersStorageKey)

        toast.success("Assessment submitted successfully!")
        router.push("/assessment-complete")
      } else {
        toast.error(data.error || "Failed to submit assessment. Please try again.")
        setIsSubmitting(false)
        setShowSubmitDialog(false)
      }
    } catch (err) {
      console.error("Submit error:", err)
      toast.error("Network error during submission. Please check connection and try again.")
      setIsSubmitting(false)
      setShowSubmitDialog(false)
    }
  }, [answers, isSubmitting, router, token, answersStorageKey, timerStorageKey])

  // Timer interval engine
  useEffect(() => {
    if (timeRemaining <= 0) {
      toast.warning("Time limit reached! Auto-submitting your assessment...")
      handleFinalSubmit()
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1
        localStorage.setItem(timerStorageKey, String(next))
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining, timerStorageKey, handleFinalSubmit])

  // Auto-save answers to localStorage every 30 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      try {
        localStorage.setItem(answersStorageKey, JSON.stringify(answers))
      } catch (e) {
        console.warn("Auto-save failed:", e)
      }
    }, 30000)

    return () => clearInterval(saveInterval)
  }, [answers, answersStorageKey])

  // Handle individual answer changes
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: value }
      localStorage.setItem(answersStorageKey, JSON.stringify(updated))
      return updated
    })
  }

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60)
    const secs = Math.max(0, seconds) % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Timer color styling
  const getTimerBadgeClass = () => {
    if (timeRemaining <= 300) return "bg-red-50 text-red-700 border-red-300 animate-pulse font-mono font-bold text-sm px-3 py-1"
    if (timeRemaining <= 600) return "bg-amber-50 text-amber-700 border-amber-300 font-mono font-bold text-sm px-3 py-1"
    return "bg-emerald-50 text-emerald-700 border-emerald-300 font-mono font-bold text-sm px-3 py-1"
  }

  const sections = [
    {
      id: 0,
      title: "Multiple Choice",
      type: "mcq",
      icon: ListChecks,
      countLabel: `${answeredMcqCount}/${mcqQuestions.length}`,
      isComplete: isMcqComplete,
    },
    {
      id: 1,
      title: "Short Answer",
      type: "short_answer",
      icon: MessageSquareText,
      countLabel: `${answeredShortCount}/${shortAnswerQuestions.length}`,
      isComplete: answeredShortCount === shortAnswerQuestions.length,
    },
    {
      id: 2,
      title: "Practical Task",
      type: "practical",
      icon: FileCode2,
      countLabel: `${answeredPracticalCount}/${practicalQuestions.length}`,
      isComplete: answeredPracticalCount === practicalQuestions.length,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                {job.title}
                <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] hidden sm:inline-flex">
                  {job.experienceLevel}
                </Badge>
              </h1>
              <p className="text-xs text-slate-400">
                Candidate: <span className="font-medium text-slate-200">{candidate.fullName}</span> ({candidate.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400 hidden sm:block" />
              <Badge variant="outline" className={getTimerBadgeClass()}>
                ⏳ {formatTime(timeRemaining)}
              </Badge>
            </div>

            <Button
              onClick={() => {
                if (!isMcqComplete) {
                  setSubmitAttempted(true)
                  setCurrentSection(0)
                  toast.error(`Please answer all ${mcqQuestions.length} MCQ questions before submitting. (${answeredMcqCount}/${mcqQuestions.length} completed)`)
                  return
                }
                setShowSubmitDialog(true)
              }}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 shadow-sm"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" /> Submit Assessment
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar (Desktop) / Header Tabs (Mobile) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assessment Sections
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {sections.map((sec) => {
                const Icon = sec.icon
                const isActive = currentSection === sec.id
                return (
                  <button
                    key={sec.id}
                    onClick={() => setCurrentSection(sec.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors text-xs font-medium ${
                      isActive
                        ? "bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-sm"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                      <span>{sec.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-2 py-0.5 font-semibold ${
                          sec.isComplete ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {sec.countLabel}
                      </Badge>
                      {sec.isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                    </div>
                  </button>
                )
              })}
            </CardContent>
            <CardFooter className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex flex-col gap-2 text-xs text-slate-500">
              <div className="w-full flex justify-between text-[11px] font-medium text-slate-600">
                <span>MCQ Progress</span>
                <span>{answeredMcqCount} of {mcqQuestions.length}</span>
              </div>
              <Progress value={(answeredMcqCount / Math.max(1, mcqQuestions.length)) * 100} className="h-1.5 bg-slate-200" />
            </CardFooter>
          </Card>

          {/* Quick Notice Card */}
          <Card className="border-amber-200 bg-amber-50/50 shadow-sm p-4 text-xs text-amber-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" /> Auto-Save Active
            </div>
            <p className="text-amber-800/90 leading-relaxed text-[11px]">
              Your responses are automatically synced every 30 seconds. Do not close your browser tab until you click Submit.
            </p>
          </Card>
        </div>

        {/* Questions Display Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Section A: MCQ */}
          {currentSection === 0 && (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-900 text-white rounded-t-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-indigo-400" /> Section A: Multiple Choice Questions
                    </CardTitle>
                    <CardDescription className="text-slate-300 text-xs mt-1">
                      Answer all {mcqQuestions.length} required questions (5 marks each). Select one option per question.
                    </CardDescription>
                  </div>
                  <Badge className="bg-indigo-600 text-white font-semibold text-xs">
                    {answeredMcqCount} / {mcqQuestions.length} Answered
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-8">
                {mcqQuestions.map((q, idx) => {
                  const selectedVal = answers[q.questionId] || ""
                  const isMissing = submitAttempted && !selectedVal

                  return (
                    <div
                      key={q.questionId}
                      className={`p-5 rounded-xl border transition-all ${
                        isMissing
                          ? "border-red-300 bg-red-50/30"
                          : selectedVal
                          ? "border-indigo-200 bg-indigo-50/20 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                          <span className="text-indigo-600 font-bold mr-1.5">Q{idx + 1}.</span> {q.question}
                        </h3>
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 shrink-0">
                          {q.marks} Marks • {q.skillTested}
                        </Badge>
                      </div>

                      <RadioGroup
                        value={selectedVal}
                        onValueChange={(val: string) => handleAnswerChange(q.questionId, val)}
                        className="space-y-2.5 pt-1"
                      >
                        {q.options.map((opt, oIdx) => {
                          const optionId = `${q.questionId}-opt-${oIdx}`
                          const isSelected = selectedVal === opt

                          return (
                            <div
                              key={optionId}
                              onClick={() => handleAnswerChange(q.questionId, opt)}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? "border-indigo-600 bg-indigo-50 text-indigo-950 font-medium shadow-sm"
                                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 text-slate-700"
                              }`}
                            >
                              <RadioGroupItem value={opt} id={optionId} className="text-indigo-600 border-slate-400" />
                              <Label htmlFor={optionId} className="cursor-pointer text-xs flex-1 leading-relaxed">
                                {opt}
                              </Label>
                            </div>
                          )
                        })}
                      </RadioGroup>

                      {isMissing && (
                        <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-2">
                          <AlertCircle className="h-3.5 w-3.5" /> Please select an answer for Q{idx + 1}.
                        </p>
                      )}
                    </div>
                  )
                })}
              </CardContent>

              <CardFooter className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
                <Button variant="outline" disabled className="text-xs">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous Section
                </Button>
                <Button onClick={() => setCurrentSection(1)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                  Next: Short Answer <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Section B: Short Answer */}
          {currentSection === 1 && (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-900 text-white rounded-t-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <MessageSquareText className="h-5 w-5 text-indigo-400" /> Section B: Short Answer Questions
                    </CardTitle>
                    <CardDescription className="text-slate-300 text-xs mt-1">
                      {shortAnswerQuestions.length} technical conceptual questions (10 marks each). Optional — answer concisely.
                    </CardDescription>
                  </div>
                  <Badge className="bg-indigo-600 text-white font-semibold text-xs">
                    {answeredShortCount} / {shortAnswerQuestions.length} Answered
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {shortAnswerQuestions.map((q, idx) => {
                  const val = answers[q.questionId] || ""
                  return (
                    <div key={q.questionId} className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                          <span className="text-indigo-600 font-bold mr-1.5">Q{idx + 11}.</span> {q.question}
                        </h3>
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 shrink-0">
                          {q.marks} Marks • {q.skillTested}
                        </Badge>
                      </div>

                      <Textarea
                        value={val}
                        onChange={(e) => handleAnswerChange(q.questionId, e.target.value)}
                        placeholder="Type your response here..."
                        className="min-h-[120px] text-xs leading-relaxed border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />

                      <div className="flex justify-end text-[11px] text-slate-400">
                        {val.length} characters
                      </div>
                    </div>
                  )
                })}
              </CardContent>

              <CardFooter className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
                <Button variant="outline" onClick={() => setCurrentSection(0)} className="text-xs">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous: MCQ
                </Button>
                <Button onClick={() => setCurrentSection(2)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                  Next: Practical Task <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Section C: Practical Task */}
          {currentSection === 2 && (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-900 text-white rounded-t-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <FileCode2 className="h-5 w-5 text-emerald-400" /> Section C: Practical Task
                    </CardTitle>
                    <CardDescription className="text-slate-300 text-xs mt-1">
                      1 Practical architectural / coding task (10 marks). Write code, pseudo-code, or an architectural overview.
                    </CardDescription>
                  </div>
                  <Badge className="bg-emerald-600 text-white font-semibold text-xs">
                    {answeredPracticalCount > 0 ? "Completed" : "Pending"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {practicalQuestions.map((q) => {
                  const val = answers[q.questionId] || ""
                  return (
                    <div key={q.questionId} className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-bold">
                            Practical Coding Task
                          </Badge>
                          <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-medium pt-1">
                            {q.question}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 shrink-0">
                          {q.marks} Marks
                        </Badge>
                      </div>

                      <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] flex items-start gap-2 font-mono">
                        <HelpCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Note: You may write production code, pseudo-code, database queries, or a structured architectural solution.</span>
                      </div>

                      <Textarea
                        value={val}
                        onChange={(e) => handleAnswerChange(q.questionId, e.target.value)}
                        placeholder="Write your technical solution or code snippet here..."
                        className="min-h-[220px] font-mono text-xs leading-relaxed bg-slate-950 text-slate-100 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500"
                      />

                      <div className="flex justify-end text-[11px] text-slate-400">
                        {val.length} characters
                      </div>
                    </div>
                  )
                })}
              </CardContent>

              <CardFooter className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
                <Button variant="outline" onClick={() => setCurrentSection(1)} className="text-xs">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous: Short Answer
                </Button>
                <Button
                  onClick={() => {
                    if (!isMcqComplete) {
                      setSubmitAttempted(true)
                      setCurrentSection(0)
                      toast.error(`Please answer all ${mcqQuestions.length} MCQ questions before submitting.`)
                      return
                    }
                    setShowSubmitDialog(true)
                  }}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2 shadow-sm"
                >
                  <Send className="h-4 w-4 mr-1.5" /> Ready to Submit Assessment
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" /> Confirm Assessment Submission
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-2 leading-relaxed">
              Are you sure you want to submit your assessment? Once submitted, your magic token session will be locked and you cannot change your answers.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <p className="font-semibold text-slate-800">Submission Summary:</p>
            <p className="text-slate-600">• MCQ Questions: <span className="font-medium text-emerald-700">{answeredMcqCount} / {mcqQuestions.length} Answered</span></p>
            <p className="text-slate-600">• Short Answer: <span className="font-medium text-slate-800">{answeredShortCount} / {shortAnswerQuestions.length} Completed</span></p>
            <p className="text-slate-600">• Practical Task: <span className="font-medium text-slate-800">{answeredPracticalCount > 0 ? "Completed" : "Not Provided"}</span></p>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Go Back
            </Button>
            <Button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              {isSubmitting ? "Submitting..." : "Confirm & Submit Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
