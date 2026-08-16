"use client"

import { ActionButtons } from "@/components/jobs/action-buttons"

interface CandidateActionButtonsProps {
  candidateId: string
  jobId: string
  currentStatus: string
  candidateName?: string
  onStatusChange?: (newStatus: string) => void
}

export function CandidateActionButtons({
  candidateId,
  jobId,
  currentStatus,
  candidateName,
  onStatusChange,
}: CandidateActionButtonsProps) {
  return (
    <ActionButtons
      candidateId={candidateId}
      candidateName={candidateName}
      jobId={jobId}
      currentStatus={currentStatus}
      variant="default"
      onActionComplete={onStatusChange}
    />
  )
}
