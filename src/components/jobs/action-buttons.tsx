"use client"

import { useState } from "react"
import { CheckCircle2, Pause, XCircle, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ActionButtonsProps {
  candidateId: string
  candidateName?: string
  jobId: string
  currentStatus: string
  variant?: "default" | "compact"
  onActionComplete?: (newStatus: string) => void
}

export function ActionButtons({
  candidateId,
  candidateName = "this candidate",
  jobId,
  currentStatus: initialStatus,
  variant = "default",
  onActionComplete,
}: ActionButtonsProps) {
  const [status, setStatus] = useState(initialStatus)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)

  const isShortlisted = status === "shortlisted"
  const isRejected = status === "rejected"
  const isOnHold = status === "on_hold"

  const executeAction = async (action: "shortlist" | "reject" | "hold") => {
    setIsLoading(action)

    try {
      const res = await fetch(`/api/candidates/${candidateId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Action failed. Please try again.")
      }

      const newStatus = data.newStatus
      setStatus(newStatus)
      if (onActionComplete) {
        onActionComplete(newStatus)
      }

      if (data.warning) {
        toast.warning(data.warning)
      } else {
        if (action === "shortlist") {
          toast.success("Candidate shortlisted successfully.")
        } else if (action === "reject") {
          toast.success("Candidate rejected and notified via email.")
        } else if (action === "hold") {
          toast.info("Candidate placed on hold.")
        }
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Action failed. Please try again."
      toast.error(errorMessage)
    } finally {
      setIsLoading(null)
    }
  }

  const handleRejectClick = () => {
    if (isRejected) return
    setRejectModalOpen(true)
  }

  const handleConfirmReject = async () => {
    setRejectModalOpen(false)
    await executeAction("reject")
  }

  const isCompact = variant === "compact"

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Shortlist Button */}
        <Button
          size={isCompact ? "icon" : "sm"}
          variant={isShortlisted ? "default" : "outline"}
          onClick={() => executeAction("shortlist")}
          disabled={isLoading !== null || isShortlisted}
          className={
            isShortlisted
              ? "bg-emerald-600 text-white hover:bg-emerald-600 cursor-default font-semibold text-xs h-9 px-3"
              : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs h-9 px-3"
          }
          title={isShortlisted ? "Shortlisted" : "Shortlist candidate"}
        >
          {isLoading === "shortlist" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          {!isCompact ? (
            <span className="ml-1.5 font-semibold">
              {isShortlisted ? "Shortlisted ✅" : "Shortlist"}
            </span>
          ) : null}
        </Button>

        {/* Hold Button */}
        <Button
          size={isCompact ? "icon" : "sm"}
          variant={isOnHold ? "default" : "outline"}
          onClick={() => executeAction("hold")}
          disabled={isLoading !== null || isOnHold}
          className={
            isOnHold
              ? "bg-slate-600 text-white hover:bg-slate-600 cursor-default font-semibold text-xs h-9 px-3"
              : "border-slate-300 text-slate-700 hover:bg-slate-50 text-xs h-9 px-3"
          }
          title={isOnHold ? "On Hold" : "Place candidate on hold"}
        >
          {isLoading === "hold" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Pause className="h-3.5 w-3.5" />
          )}
          {!isCompact ? (
            <span className="ml-1.5 font-semibold">
              {isOnHold ? "On Hold ⏸" : "Hold"}
            </span>
          ) : null}
        </Button>

        {/* Reject Button */}
        <Button
          size={isCompact ? "icon" : "sm"}
          variant={isRejected ? "default" : "outline"}
          onClick={handleRejectClick}
          disabled={isLoading !== null || isRejected}
          className={
            isRejected
              ? "bg-red-600 text-white hover:bg-red-600 cursor-default font-semibold text-xs h-9 px-3"
              : "border-red-300 text-red-700 hover:bg-red-50 text-xs h-9 px-3"
          }
          title={isRejected ? "Rejected" : "Reject candidate"}
        >
          {isLoading === "reject" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {!isCompact ? (
            <span className="ml-1.5 font-semibold">
              {isRejected ? "Rejected ❌" : "Reject"}
            </span>
          ) : null}
        </Button>
      </div>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md bg-white p-6">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2 text-red-600">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Reject this candidate?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-1">
              This will send a rejection email to <span className="font-semibold text-slate-900">{candidateName}</span>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              className="text-xs h-9 border-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmReject}
              className="text-xs h-9 bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Yes, Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
