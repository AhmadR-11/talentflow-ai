"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  Bot,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  User,
  Check,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

interface QAPair {
  question: string
  answer: string
}

interface InterviewShellProps {
  token: string
  candidate: {
    id: string
    fullName: string
    email: string
  }
  job: {
    title: string
    requiredSkills: string[]
    experienceLevel: string
  }
}

export function InterviewShell({ token, candidate, job }: InterviewShellProps) {
  const router = useRouter()

  const [currentQuestion, setCurrentQuestion] = useState<string>("")
  const [currentAnswer, setCurrentAnswer] = useState<string>("")
  const [questionNumber, setQuestionNumber] = useState<number>(1)
  const [transcript, setTranscript] = useState<QAPair[]>([])
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [interviewComplete, setInterviewComplete] = useState<boolean>(false)
  const [timerRemaining, setTimerRemaining] = useState<number>(300) // 5 minutes per question
  const [isMock, setIsMock] = useState<boolean>(false)
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false)

  // Fetch initial interview state on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const mockParam = urlParams.get("mock") === "true"
    setIsMock(mockParam)

    async function fetchInterviewState() {
      try {
        const apiUrl = `/api/interview/${token}${mockParam ? "?mock=true" : ""}`
        const res = await fetch(apiUrl)
        const data = await res.json()

        if (res.ok && data.success) {
          if (data.interviewComplete) {
            setInterviewComplete(true)
            router.push("/interview-complete")
            return
          }

          setTranscript(data.transcript || [])
          setQuestionNumber(data.questionNumber || 1)
          setCurrentQuestion(data.nextQuestion || "Tell me about yourself and your background.")
        } else {
          toast.error(data.error || "Failed to load interview session.")
        }
      } catch (err) {
        console.error("Fetch interview state error:", err)
        toast.error("Network error loading interview session.")
      } finally {
        setIsLoadingInitial(false)
      }
    }

    fetchInterviewState()
  }, [token, router])

  // Handle single answer submit
  const handleAnswerSubmit = useCallback(
    async (submittedAnswerText?: string) => {
      const textToSubmit = (submittedAnswerText ?? currentAnswer).trim()
      const answerBody = textToSubmit.length > 0 ? textToSubmit : "[No answer provided]"

      if (isSubmitting || !currentQuestion) return
      setIsSubmitting(true)

      try {
        const apiUrl = `/api/interview/${token}/answer${isMock ? "?mock=true" : ""}`
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: currentQuestion,
            answer: answerBody,
            questionNumber,
          }),
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setTranscript(data.transcript || [])
          setCurrentAnswer("")
          setTimerRemaining(300) // Reset 5-minute timer for next question

          if (data.interviewComplete) {
            setInterviewComplete(true)
          } else {
            setQuestionNumber(data.questionNumber)
            setCurrentQuestion(data.nextQuestion)
          }
        } else {
          toast.error(data.error || "Failed to save response. Please try again.")
        }
      } catch (err) {
        console.error("Answer submission error:", err)
        toast.error("Network error submitting response.")
      } finally {
        setIsSubmitting(false)
      }
    },
    [currentQuestion, currentAnswer, isSubmitting, token, isMock]
  )

  // Per-question 5-minute countdown timer engine
  useEffect(() => {
    if (isLoadingInitial || interviewComplete || !currentQuestion) return

    if (timerRemaining <= 0) {
      toast.warning(`Time's up for Question ${questionNumber}! Submitting response...`)
      handleAnswerSubmit(currentAnswer.trim().length >= 20 ? currentAnswer : "[No answer provided]")
      return
    }

    const interval = setInterval(() => {
      setTimerRemaining((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [timerRemaining, isLoadingInitial, interviewComplete, currentQuestion, questionNumber, currentAnswer, handleAnswerSubmit])

  // Complete interview session POST handler
  const handleCompleteInterview = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/interview/${token}/submit`, {
        method: "POST",
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success("Interview completed successfully!")
        router.push("/interview-complete")
      } else {
        toast.error(data.error || "Failed to finalize interview session.")
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error("Complete interview error:", err)
      toast.error("Network error completing interview.")
      setIsSubmitting(false)
    }
  }

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60)
    const secs = Math.max(0, seconds) % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Timer color badge
  const getTimerBadgeClass = () => {
    if (timerRemaining <= 60) return "bg-red-50 text-red-700 border-red-300 animate-pulse font-mono font-bold text-xs px-3 py-1"
    if (timerRemaining <= 120) return "bg-amber-50 text-amber-700 border-amber-300 font-mono font-bold text-xs px-3 py-1"
    return "bg-emerald-50 text-emerald-700 border-emerald-300 font-mono font-bold text-xs px-3 py-1"
  }

  if (isLoadingInitial) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Sparkles className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-semibold">Initializing AI Interview Session...</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-950 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">TalentFlow AI</span>
              <p className="text-[11px] text-indigo-300">Interview — {job.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isMock && (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                ⚡ MOCK MODE ACTIVE
              </Badge>
            )}
            <Badge className="bg-indigo-900 text-indigo-200 border-indigo-700 text-xs px-3 py-1 font-semibold">
              Question {Math.min(questionNumber, 7)} of 7
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-600">
            <span>Interview Progress</span>
            <span>{Math.round(((questionNumber - 1) / 7) * 100)}% Completed</span>
          </div>
          <Progress value={((questionNumber - 1) / 7) * 100} className="h-2 bg-slate-200" />
        </div>

        {/* AI Question & Answer Container */}
        {!interviewComplete ? (
          <div className="space-y-6">
            {/* AI Question Bubble */}
            <Card className="border-indigo-200 bg-slate-900 text-white shadow-md overflow-hidden">
              <CardHeader className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                  <Bot className="h-4 w-4 text-emerald-400 animate-pulse" /> TalentFlow AI Recruiter
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <Badge variant="outline" className={getTimerBadgeClass()}>
                    ⏱️ {formatTime(timerRemaining)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                  "{currentQuestion}"
                </p>
              </CardContent>
            </Card>

            {/* Answer Input Card */}
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-4 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Your Response</span>
                  <span className="text-slate-400 font-normal text-[11px]">
                    {currentAnswer.trim().length} characters
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here... (minimum 20 characters)"
                  className="min-h-[160px] text-xs sm:text-sm leading-relaxed border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    {currentAnswer.trim().length < 20 ? (
                      <span className="text-amber-600 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Minimum 20 characters required ({20 - currentAnswer.trim().length} more needed)
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Response meets length requirement
                      </span>
                    )}
                  </p>

                  <Button
                    onClick={() => handleAnswerSubmit()}
                    disabled={currentAnswer.trim().length < 20 || isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 w-full sm:w-auto shadow-sm"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Answer →"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Interview Completed Final Card */
          <Card className="border-emerald-200 bg-emerald-50/40 shadow-sm p-6 sm:p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">All 7 Questions Answered!</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                You have answered all 7 interview questions. Click below to finalize your interview session.
              </p>
            </div>
            <Button
              onClick={handleCompleteInterview}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-8 py-3 shadow-md"
            >
              {isSubmitting ? "Finalizing Session..." : "Complete Interview ✓"}
            </Button>
          </Card>
        )}

        {/* Collapsible Previous Answers Accordion */}
        {transcript.length > 0 && (
          <Card className="border-slate-200 bg-white shadow-sm">
            <button
              onClick={() => setIsAccordionOpen((prev) => !prev)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                  {transcript.length} Responded
                </Badge>
                <span className="text-xs font-bold text-slate-800">Previous Q&A Dialogue</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isAccordionOpen ? "rotate-180" : ""}`} />
            </button>

            {isAccordionOpen && (
              <CardContent className="p-4 sm:p-6 border-t border-slate-100 space-y-4">
                {transcript.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                        <Bot className="h-3.5 w-3.5" /> Question {idx + 1}
                      </span>
                      <p className="text-xs font-semibold text-slate-900">{item.question}</p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <User className="h-3 w-3" /> Candidate Response
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed">{item.answer}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        )}
      </main>
    </div>
  )
}
