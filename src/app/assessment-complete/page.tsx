import { CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function AssessmentCompletePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full border-slate-200 bg-white shadow-md text-center p-8 flex flex-col items-center gap-4">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 shrink-0" />
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Assessment Submitted!
          </h1>
          <p className="text-slate-500 text-sm max-w-sm text-center leading-relaxed">
            Thank you for completing the assessment. Our team will review your responses and be in touch soon.
          </p>
        </div>

        <div className="w-full border-t border-slate-100 my-2" />

        <p className="text-xs text-slate-400 font-medium">
          TalentFlow AI — Intelligent Recruitment
        </p>
      </Card>
    </main>
  )
}
