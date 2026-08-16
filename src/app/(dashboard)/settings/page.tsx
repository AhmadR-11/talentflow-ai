"use client"

import { useState, useEffect } from "react"
import {
  User,
  Lock,
  Sliders,
  Bell,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)

  // Profile Form States
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [initialEmail, setInitialEmail] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState("")

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  // Scoring Weights States
  const [resumeWeight, setResumeWeight] = useState(30)
  const [testWeight, setTestWeight] = useState(40)
  const [interviewWeight, setInterviewWeight] = useState(30)
  const [isSavingWeights, setIsSavingWeights] = useState(false)

  // Notification Preference States
  const [notifyPipeline, setNotifyPipeline] = useState(true)
  const [notifyComplete, setNotifyComplete] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings")
        const data = await res.json()

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load settings")
        }

        setName(data.profile.name || "")
        setEmail(data.profile.email || "")
        setInitialEmail(data.profile.email || "")

        const prefs = data.profile.preferences || {}
        const weights = prefs.defaultWeights || { resume: 30, test: 40, interview: 30 }

        setResumeWeight(weights.resume ?? 30)
        setTestWeight(weights.test ?? 40)
        setInterviewWeight(weights.interview ?? 30)

        setNotifyPipeline(prefs.notifyPipeline ?? true)
        setNotifyComplete(prefs.notifyComplete ?? true)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load settings"
        toast.error(msg)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Auto-rebalance weights to always equal 100%
  const handleWeightChange = (changedKey: "resume" | "test" | "interview", value: number) => {
    const val = Math.max(0, Math.min(100, value))

    if (changedKey === "resume") {
      const remaining = 100 - val
      const currentOtherSum = testWeight + interviewWeight
      if (currentOtherSum === 0) {
        setTestWeight(Math.round(remaining / 2))
        setInterviewWeight(remaining - Math.round(remaining / 2))
      } else {
        const newTest = Math.round((testWeight / currentOtherSum) * remaining)
        setTestWeight(newTest)
        setInterviewWeight(remaining - newTest)
      }
      setResumeWeight(val)
    } else if (changedKey === "test") {
      const remaining = 100 - val
      const currentOtherSum = resumeWeight + interviewWeight
      if (currentOtherSum === 0) {
        setResumeWeight(Math.round(remaining / 2))
        setInterviewWeight(remaining - Math.round(remaining / 2))
      } else {
        const newResume = Math.round((resumeWeight / currentOtherSum) * remaining)
        setResumeWeight(newResume)
        setInterviewWeight(remaining - newResume)
      }
      setTestWeight(val)
    } else if (changedKey === "interview") {
      const remaining = 100 - val
      const currentOtherSum = resumeWeight + testWeight
      if (currentOtherSum === 0) {
        setResumeWeight(Math.round(remaining / 2))
        setTestWeight(remaining - Math.round(remaining / 2))
      } else {
        const newResume = Math.round((resumeWeight / currentOtherSum) * remaining)
        setResumeWeight(newResume)
        setTestWeight(remaining - newResume)
      }
      setInterviewWeight(val)
    }
  }

  // Profile Form Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError("")

    if (!name.trim()) {
      setProfileError("Display name cannot be empty.")
      return
    }

    setIsSavingProfile(true)

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile.")
      }

      if (data.emailChanged) {
        toast.info(data.message || "Verification email sent. Please check your inbox.")
      } else {
        toast.success("Profile updated successfully.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile."
      setProfileError(msg)
      toast.error(msg)
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Password Form Handler
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")

    if (!currentPassword) {
      setPasswordError("Please enter your current password.")
      return
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Confirm password does not match new password.")
      return
    }

    setIsSavingPassword(true)

    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update password.")
      }

      toast.success("Password updated successfully.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password."
      setPasswordError(msg)
      toast.error(msg)
    } finally {
      setIsSavingPassword(false)
    }
  }

  // Default Weights Form Handler
  const handleSaveWeights = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingWeights(true)

    try {
      const res = await fetch("/api/settings/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultWeights: {
            resume: resumeWeight,
            test: testWeight,
            interview: interviewWeight,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save default weights.")
      }

      toast.success("Default weights saved.")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save default weights."
      toast.error(msg)
    } finally {
      setIsSavingWeights(false)
    }
  }

  // Notification Toggle Auto-save Handler
  const handleToggleNotification = async (key: "notifyPipeline" | "notifyComplete", value: boolean) => {
    if (key === "notifyPipeline") setNotifyPipeline(value)
    if (key === "notifyComplete") setNotifyComplete(value)

    try {
      const res = await fetch("/api/settings/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [key]: value,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update notification settings.")
      }

      toast.success("Preferences saved.")
    } catch (err: unknown) {
      toast.error("Failed to update notification preferences.")
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Card className="p-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </Card>
        </div>
      </main>
    )
  }

  const totalWeights = resumeWeight + testWeight + interviewWeight

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Account & App Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your HR profile credentials, default candidate evaluation weights, and email notifications.
          </p>
        </div>

        {/* ───────── 3-Tab Settings Container ───────── */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-200/80 p-1 rounded-xl">
            <TabsTrigger value="profile" className="text-xs font-semibold">
              Profile & Password
            </TabsTrigger>
            <TabsTrigger value="weights" className="text-xs font-semibold">
              Default Scoring Weights
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs font-semibold">
              Notification Preferences
            </TabsTrigger>
          </TabsList>

          {/* ───────── TAB 1: PROFILE & PASSWORD ───────── */}
          <TabsContent value="profile" className="space-y-6">
            {/* Profile Form */}
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <User className="h-4.5 w-4.5 text-indigo-600" /> HR Manager Profile
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Update your public display name and account email address.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                  {profileError ? (
                    <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                      {profileError}
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Display Name</label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Email Address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hr@company.com"
                      className="text-xs h-9"
                    />
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                      <Mail className="h-3 w-3 text-slate-400" /> Changing your email will require verification.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSavingProfile}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4"
                  >
                    {isSavingProfile ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Save Profile
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Password Change Form */}
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Lock className="h-4.5 w-4.5 text-slate-600" /> Security & Password Change
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Update your login password securely.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSavePassword} className="space-y-4 max-w-xl">
                  {passwordError ? (
                    <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Current Password</label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">New Password</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSavingPassword}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold h-9 px-4"
                  >
                    {isSavingPassword ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ───────── TAB 2: DEFAULT SCORING WEIGHTS ───────── */}
          <TabsContent value="weights" className="space-y-6">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Sliders className="h-4.5 w-4.5 text-indigo-600" /> Default Candidate Scoring Weights
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-1">
                      These weights will be pre-filled whenever you create a new job posting. You can override them per job.
                    </CardDescription>
                  </div>
                  <Badge
                    variant={totalWeights === 100 ? "default" : "destructive"}
                    className={
                      totalWeights === 100
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1 text-xs font-bold"
                        : "px-3 py-1 text-xs font-bold"
                    }
                  >
                    Total: {totalWeights}% {totalWeights === 100 ? "✅" : "⚠️"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={handleSaveWeights} className="space-y-6 max-w-2xl">
                  {/* Slider 1: Resume Match */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-800">Resume Match Weight</span>
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {resumeWeight}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={resumeWeight}
                      onChange={(e) => handleWeightChange("resume", parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    />
                  </div>

                  {/* Slider 2: Skills Test */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-800">Skills Test Weight</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {testWeight}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={testWeight}
                      onChange={(e) => handleWeightChange("test", parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>

                  {/* Slider 3: AI Interview */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-800">AI Interview Weight</span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {interviewWeight}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={interviewWeight}
                      onChange={(e) => handleWeightChange("interview", parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSavingWeights || totalWeights !== 100}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4"
                  >
                    {isSavingWeights ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Save Default Weights
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ───────── TAB 3: NOTIFICATIONS ───────── */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Bell className="h-4.5 w-4.5 text-amber-500" /> Email Notification Preferences
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Configure when TalentFlow AI sends email notifications to your inbox.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6 max-w-2xl">
                {/* Toggle 1: New candidates in pipeline */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="space-y-0.5 max-w-md">
                    <label className="text-xs font-bold text-slate-900">
                      Pipeline Sourcing Notifications
                    </label>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Notify me when new candidates appear in my pipeline.
                    </p>
                  </div>
                  <Switch
                    checked={notifyPipeline}
                    onCheckedChange={(checked: boolean) =>
                      handleToggleNotification("notifyPipeline", checked)
                    }
                  />
                </div>

                {/* Toggle 2: All candidates processed */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="space-y-0.5 max-w-md">
                    <label className="text-xs font-bold text-slate-900">
                      Job Batch Processed Notifications
                    </label>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Notify me when all candidates for a job have been processed.
                    </p>
                  </div>
                  <Switch
                    checked={notifyComplete}
                    onCheckedChange={(checked: boolean) =>
                      handleToggleNotification("notifyComplete", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
