"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sliders, Save, X, Pencil, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ScoringWeightsEditorProps {
  jobId: string
  resumeWeight: number
  testWeight: number
  interviewWeight: number
}

export function ScoringWeightsEditor({
  jobId,
  resumeWeight: initialResume,
  testWeight: initialTest,
  interviewWeight: initialInterview,
}: ScoringWeightsEditorProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const [resumeWeight, setResumeWeight] = useState(initialResume)
  const [testWeight, setTestWeight] = useState(initialTest)
  const [interviewWeight, setInterviewWeight] = useState(initialInterview)

  const total = resumeWeight + testWeight + interviewWeight
  const isValid = total === 100

  const handleCancel = () => {
    setResumeWeight(initialResume)
    setTestWeight(initialTest)
    setInterviewWeight(initialInterview)
    setIsEditing(false)
    setError("")
  }

  const handleSave = async () => {
    if (!isValid) {
      setError("Total weights must equal exactly 100%.")
      return
    }

    setIsSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/jobs/${jobId}/weights`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeWeight, testWeight, interviewWeight }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update weights")
      }

      setIsEditing(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.")
    } finally {
      setIsSaving(false)
    }
  }

  const weights = [
    {
      label: "Resume Parsing",
      value: resumeWeight,
      setter: setResumeWeight,
      color: "bg-slate-800",
    },
    {
      label: "Assessment Test",
      value: testWeight,
      setter: setTestWeight,
      color: "bg-emerald-500",
    },
    {
      label: "AI Interview",
      value: interviewWeight,
      setter: setInterviewWeight,
      color: "bg-indigo-500",
    },
  ]

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-slate-600" /> Evaluation Weights
          </CardTitle>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-7 px-2.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        ) : null}

        {isEditing ? (
          <div
            className={`flex items-center justify-between rounded-lg p-3 border ${
              isValid
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <span className="text-xs font-semibold">Total</span>
            <span className="text-sm font-bold">{total}%</span>
          </div>
        ) : null}

        {weights.map(({ label, value, setter, color }) => (
          <div key={label} className="space-y-2">
            <div className="flex justify-between font-medium text-slate-700">
              <span>{label}</span>
              <span className="font-bold text-slate-900">{value}%</span>
            </div>

            {isEditing ? (
              <Slider
                value={[value]}
                onValueChange={(val) => {
                  const num = Array.isArray(val) ? val[0] : typeof val === "number" ? val : 0
                  setter(num)
                }}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            ) : (
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all`}
                  style={{ width: `${value}%` }}
                />
              </div>
            )}
          </div>
        ))}

        {isEditing ? (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 text-xs"
            >
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !isValid}
              className="h-8 text-xs"
            >
              {isSaving ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Save className="h-3 w-3" /> Save Weights
                </span>
              )}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
