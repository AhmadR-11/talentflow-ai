"use client"

import { AlertCircle, Globe2, Share2, Briefcase, Sparkles } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface SourcingConfigValues {
  linkedinEnabled: boolean
  upworkEnabled: boolean
  indeedEnabled: boolean
}

interface SourcingConfigPanelProps {
  value: SourcingConfigValues
  onChange: (value: SourcingConfigValues) => void
  error?: string
}

export function SourcingConfigPanel({
  value,
  onChange,
  error,
}: SourcingConfigPanelProps) {
  const isNoneSelected =
    !value?.linkedinEnabled && !value?.upworkEnabled && !value?.indeedEnabled

  const handleToggle = (key: keyof SourcingConfigValues, checked: boolean) => {
    onChange({
      ...value,
      [key]: checked,
    })
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-6 md:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-emerald-600" />
              Sourcing Configuration
            </h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-600" /> Channels & Automation
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Enable automated candidate sourcing across external talent platforms. At least one platform must be active.
          </p>
        </div>

        {/* Warning Banner if No Platform is Selected */}
        {isNoneSelected || error ? (
          <div
            className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Sourcing Selection Required</p>
              <p className="text-xs text-amber-800 mt-0.5">
                {error || "Please select at least one sourcing platform"}
              </p>
            </div>
          </div>
        ) : null}

        {/* Platform Toggle Cards */}
        <div className="space-y-4">
          {/* LinkedIn Toggle */}
          <div
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              value?.linkedinEnabled
                ? "border-blue-200 bg-blue-50/30"
                : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-lg ${
                  value?.linkedinEnabled
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                <Share2 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="linkedinEnabled"
                    className="text-sm font-semibold text-slate-900 cursor-pointer"
                  >
                    LinkedIn Talent Solutions
                  </Label>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Popular
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Automatically match and pull profiles from LinkedIn Recruiter & Job Network.
                </p>
              </div>
            </div>

            <Switch
              id="linkedinEnabled"
              checked={value?.linkedinEnabled ?? false}
              onCheckedChange={(checked) => handleToggle("linkedinEnabled", checked)}
              aria-label="Toggle LinkedIn sourcing"
            />
          </div>

          {/* Upwork Toggle */}
          <div
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              value?.upworkEnabled
                ? "border-emerald-200 bg-emerald-50/30"
                : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-lg ${
                  value?.upworkEnabled
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="upworkEnabled"
                    className="text-sm font-semibold text-slate-900 cursor-pointer"
                  >
                    Upwork Freelancer Network
                  </Label>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    Contractors
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Source top-rated contract talent and specialized freelance candidates.
                </p>
              </div>
            </div>

            <Switch
              id="upworkEnabled"
              checked={value?.upworkEnabled ?? false}
              onCheckedChange={(checked) => handleToggle("upworkEnabled", checked)}
              aria-label="Toggle Upwork sourcing"
            />
          </div>

          {/* Indeed Toggle */}
          <div
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              value?.indeedEnabled
                ? "border-indigo-200 bg-indigo-50/30"
                : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-lg ${
                  value?.indeedEnabled
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                <Globe2 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="indeedEnabled"
                    className="text-sm font-semibold text-slate-900 cursor-pointer"
                  >
                    Indeed Job Aggregator
                  </Label>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                    Global
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Distribute job posting across Indeed's global candidate search engine.
                </p>
              </div>
            </div>

            <Switch
              id="indeedEnabled"
              checked={value?.indeedEnabled ?? false}
              onCheckedChange={(checked) => handleToggle("indeedEnabled", checked)}
              aria-label="Toggle Indeed sourcing"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
