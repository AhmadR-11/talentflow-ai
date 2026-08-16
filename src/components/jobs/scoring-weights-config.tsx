"use client"

import { Sliders, CheckCircle2, Sparkles, FileText, Brain, Video } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export interface ScoringWeightsValues {
  resumeWeight: number
  testWeight: number
  interviewWeight: number
}

interface ScoringWeightsConfigPanelProps {
  value: ScoringWeightsValues
  onChange: (value: ScoringWeightsValues) => void
  error?: string
}

const PRESETS = [
  { label: "Default (30/40/30)", resume: 30, test: 40, interview: 30 },
  { label: "Technical Focus (20/60/20)", resume: 20, test: 60, interview: 20 },
  { label: "Interview Focus (20/30/50)", resume: 20, test: 30, interview: 50 },
  { label: "Resume Focus (50/30/20)", resume: 50, test: 30, interview: 20 },
]

export function ScoringWeightsConfigPanel({
  value,
  onChange,
  error,
}: ScoringWeightsConfigPanelProps) {
  const current = value || { resumeWeight: 30, testWeight: 40, interviewWeight: 30 }
  const total = Number(current.resumeWeight) + Number(current.testWeight) + Number(current.interviewWeight)

  // Enforces that all three weights always sum to exactly 100% by auto-adjusting the other two sliders
  const handleWeightChange = (key: keyof ScoringWeightsValues, rawVal: number) => {
    const targetVal = Math.max(0, Math.min(100, isNaN(rawVal) ? 0 : rawVal))
    const remaining = 100 - targetVal

    if (key === "resumeWeight") {
      const otherSum = current.testWeight + current.interviewWeight
      let newTest: number
      let newInterview: number

      if (otherSum > 0) {
        newTest = Math.round(remaining * (current.testWeight / otherSum))
        newInterview = remaining - newTest
      } else {
        newTest = Math.floor(remaining / 2)
        newInterview = remaining - newTest
      }

      onChange({
        resumeWeight: targetVal,
        testWeight: Math.max(0, Math.min(100, newTest)),
        interviewWeight: Math.max(0, Math.min(100, newInterview)),
      })
    } else if (key === "testWeight") {
      const otherSum = current.resumeWeight + current.interviewWeight
      let newResume: number
      let newInterview: number

      if (otherSum > 0) {
        newResume = Math.round(remaining * (current.resumeWeight / otherSum))
        newInterview = remaining - newResume
      } else {
        newResume = Math.floor(remaining / 2)
        newInterview = remaining - newResume
      }

      onChange({
        resumeWeight: Math.max(0, Math.min(100, newResume)),
        testWeight: targetVal,
        interviewWeight: Math.max(0, Math.min(100, newInterview)),
      })
    } else if (key === "interviewWeight") {
      const otherSum = current.resumeWeight + current.testWeight
      let newResume: number
      let newTest: number

      if (otherSum > 0) {
        newResume = Math.round(remaining * (current.resumeWeight / otherSum))
        newTest = remaining - newResume
      } else {
        newResume = Math.floor(remaining / 2)
        newTest = remaining - newResume
      }

      onChange({
        resumeWeight: Math.max(0, Math.min(100, newResume)),
        testWeight: Math.max(0, Math.min(100, newTest)),
        interviewWeight: targetVal,
      })
    }
  }

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    onChange({
      resumeWeight: preset.resume,
      testWeight: preset.test,
      interviewWeight: preset.interview,
    })
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-6 md:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-indigo-600" />
              Scoring Weights Configuration
            </h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Total: {total}% ✅
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure the evaluation criteria weights for calculating candidate composite scores. All three weights automatically adjust to sum to exactly 100%.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        {/* Quick Presets */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Quick Presets
          </Label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const isSelected =
                current.resumeWeight === preset.resume &&
                current.testWeight === preset.test &&
                current.interviewWeight === preset.interview

              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold shadow-xs ring-1 ring-indigo-600"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="space-y-5 pt-2">
          {/* 1. Resume Match Weight */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-md bg-slate-800 p-2 text-white">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="resumeWeight" className="text-sm font-semibold text-slate-900 cursor-pointer">
                    Resume Match Weight <span className="text-xs font-normal text-slate-500">(default: 30%)</span>
                  </Label>
                  <p className="text-xs text-slate-500">
                    Keyword matching, verified skills, and background relevance.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
                <input
                  id="resumeWeight"
                  type="number"
                  min={0}
                  max={100}
                  value={current.resumeWeight}
                  onChange={(e) => handleWeightChange("resumeWeight", parseInt(e.target.value, 10))}
                  className="w-12 text-right font-bold text-slate-900 outline-none text-sm"
                />
                <span className="text-xs font-bold text-slate-500">%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={current.resumeWeight}
              onChange={(e) => handleWeightChange("resumeWeight", parseInt(e.target.value, 10))}
              className="w-full accent-slate-800 cursor-pointer"
            />
          </div>

          {/* 2. Skills Test Weight */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-md bg-emerald-600 p-2 text-white">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="testWeight" className="text-sm font-semibold text-slate-900 cursor-pointer">
                    Skills Test Weight <span className="text-xs font-normal text-slate-500">(default: 40%)</span>
                  </Label>
                  <p className="text-xs text-slate-500">
                    Automated technical screening, assessment quiz, and coding exercises.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
                <input
                  id="testWeight"
                  type="number"
                  min={0}
                  max={100}
                  value={current.testWeight}
                  onChange={(e) => handleWeightChange("testWeight", parseInt(e.target.value, 10))}
                  className="w-12 text-right font-bold text-emerald-700 outline-none text-sm"
                />
                <span className="text-xs font-bold text-slate-500">%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={current.testWeight}
              onChange={(e) => handleWeightChange("testWeight", parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* 3. AI Interview Weight */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-md bg-indigo-600 p-2 text-white">
                  <Video className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="interviewWeight" className="text-sm font-semibold text-slate-900 cursor-pointer">
                    AI Interview Weight <span className="text-xs font-normal text-slate-500">(default: 30%)</span>
                  </Label>
                  <p className="text-xs text-slate-500">
                    Conversational interview depth, communication clarity, and problem solving.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
                <input
                  id="interviewWeight"
                  type="number"
                  min={0}
                  max={100}
                  value={current.interviewWeight}
                  onChange={(e) => handleWeightChange("interviewWeight", parseInt(e.target.value, 10))}
                  className="w-12 text-right font-bold text-indigo-700 outline-none text-sm"
                />
                <span className="text-xs font-bold text-slate-500">%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={current.interviewWeight}
              onChange={(e) => handleWeightChange("interviewWeight", parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Visual Stacked Composition Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>Score Composition Ratio</span>
            <span className="font-semibold text-slate-700">
              Resume ({current.resumeWeight}%) • Skills Test ({current.testWeight}%) • AI Interview ({current.interviewWeight}%)
            </span>
          </div>
          <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200 shadow-inner">
            <div
              className="bg-slate-800 transition-all duration-150"
              style={{ width: `${Math.max(0, current.resumeWeight)}%` }}
              title={`Resume Match: ${current.resumeWeight}%`}
            />
            <div
              className="bg-emerald-500 transition-all duration-150"
              style={{ width: `${Math.max(0, current.testWeight)}%` }}
              title={`Skills Test: ${current.testWeight}%`}
            />
            <div
              className="bg-indigo-500 transition-all duration-150"
              style={{ width: `${Math.max(0, current.interviewWeight)}%` }}
              title={`AI Interview: ${current.interviewWeight}%`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

