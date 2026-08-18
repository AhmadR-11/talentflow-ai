import { redirect } from "next/navigation"
import { validateInterviewToken } from "@/lib/candidate-token"
import { prisma } from "@/lib/prisma"
import { InterviewShell } from "@/components/interview/InterviewShell"

interface InterviewPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function CandidateInterviewTokenPage({ params }: InterviewPageProps) {
  const { token } = await params

  const res = await validateInterviewToken(token)

  if (!res.valid) {
    if (res.reason === "already_submitted") {
      redirect("/interview-complete")
    }
    redirect("/link-expired")
  }

  const { candidate, job } = res

  // Prerequisite Check: candidate must complete assessment first (status !== 'sourced')
  const candidateRecord = await prisma.candidate.findUnique({
    where: { id: candidate.id },
    include: { assessmentSubmission: true },
  })

  if (candidateRecord?.status === "sourced" && !candidateRecord?.assessmentSubmission) {
    if (candidateRecord?.assessmentToken) {
      redirect(`/assessment/${candidateRecord.assessmentToken}`)
    }
    redirect("/link-expired")
  }

  return (
    <InterviewShell
      token={token}
      candidate={candidate}
      job={job}
    />
  )
}
