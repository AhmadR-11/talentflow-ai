import { CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"

interface InterviewCompletePageProps {
  searchParams?: Promise<{
    name?: string
    job?: string
  }>
}

export default async function InterviewCompletePage({ searchParams }: InterviewCompletePageProps) {
  const params = searchParams ? await searchParams : {}
  const firstName = params?.name ? params.name.trim().split(" ")[0] : ""
  const jobTitle = params?.job ? decodeURIComponent(params.job.trim()) : ""

  const subtext = firstName
    ? `Thank you ${firstName}. We've reviewed your responses and our team will be in touch shortly.`
    : "Thank you. We've reviewed your responses and our team will be in touch shortly."

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full border-slate-200 bg-white shadow-md text-center p-8 flex flex-col items-center gap-4">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 shrink-0" />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Interview Complete!
          </h1>
          <p className="text-slate-600 text-sm max-w-sm text-center leading-relaxed">
            {subtext}
          </p>
        </div>

        {jobTitle && (
          <div className="bg-slate-100/80 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700">
            Role: <span className="text-slate-900 font-semibold">{jobTitle}</span>
          </div>
        )}

        <div className="w-full border-t border-slate-100 my-2" />

        <p className="text-xs text-slate-400 font-medium">
          TalentFlow AI — Intelligent Recruitment
        </p>
      </Card>
    </main>
  )
}
