"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Rocket, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

interface LaunchJobButtonProps {
  jobId: string
  jobStatus: string
}

export function LaunchJobButton({ jobId, jobStatus }: LaunchJobButtonProps) {
  const router = useRouter()
  const [isLaunching, setIsLaunching] = useState(false)
  const isActive = jobStatus === "active"

  const handleLaunch = async () => {
    setIsLaunching(true)

    try {
      const response = await fetch(`/api/jobs/${jobId}/launch`, {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to launch job automation")
      }

      if (result.warning) {
        toast.warning(result.warning, {
          description: "Job status is active, but webhook could not connect.",
          duration: 6000,
        })
      } else {
        toast.success("Job launched & automation triggered!", {
          description: "Candidates will begin appearing in your pipeline shortly.",
          duration: 6000,
        })
      }

      router.refresh()
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to trigger automation"
      toast.error(errorMessage)
    } finally {
      setIsLaunching(false)
    }
  }

  return (
    <Button
      onClick={handleLaunch}
      disabled={isLaunching}
      variant={isActive ? "outline" : "default"}
      className={
        isActive
          ? "border-slate-300 bg-white hover:bg-slate-50 text-slate-800"
          : "bg-indigo-600 hover:bg-indigo-700 text-white"
      }
    >
      {isLaunching ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Launching...
        </span>
      ) : (
        <span className="flex items-center gap-2 font-semibold">
          {isActive ? (
            <>
              <RefreshCw className="h-4 w-4 text-indigo-600" /> Retry Automation
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" /> Launch Job
            </>
          )}
        </span>
      )}
    </Button>
  )
}
