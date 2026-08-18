import { AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function LinkExpiredPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full border-slate-200 bg-white shadow-md text-center p-8 flex flex-col items-center gap-4">
        <AlertCircle className="h-16 w-16 text-amber-500 shrink-0" />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            This Link Has Expired
          </h1>
          <p className="text-slate-600 text-sm max-w-sm text-center leading-relaxed">
            This assessment or interview link is no longer valid. Please contact the hiring team for assistance.
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
