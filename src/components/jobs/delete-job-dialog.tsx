"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DeleteJobDialogProps {
  jobId: string
  jobTitle?: string
  variant?: "button" | "icon" | "danger-button"
  redirectOnDelete?: boolean
  onDeleted?: () => void
}

export function DeleteJobDialog({
  jobId,
  jobTitle = "this job posting",
  variant = "button",
  redirectOnDelete = true,
  onDeleted,
}: DeleteJobDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  const handleDelete = async () => {
    setIsDeleting(true)
    setError("")

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to delete job posting")
      }

      setOpen(false)
      if (onDeleted) {
        onDeleted()
      }
      if (redirectOnDelete) {
        router.push("/jobs")
      }
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete job"
      setError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          variant === "icon" ? (
            <Button
              variant="outline"
              size="icon-sm"
              className="text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
              title="Delete Job"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : variant === "danger-button" ? (
            <Button
              type="button"
              variant="destructive"
              className="gap-2 bg-red-600 text-white hover:bg-red-700 shadow-sm"
            >
              <Trash2 className="h-4 w-4" /> Delete Job
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-slate-200 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Delete Job Posting
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-800">{jobTitle}</strong>? All associated sourcing
              channels, evaluation weights, candidate records, tests, and interview transcripts will
              be permanently deleted.
            </DialogDescription>
          </div>
        </DialogHeader>

        {error ? (
          <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <DialogFooter className="mt-2 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </span>
            ) : (
              "Yes, Delete Job"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
