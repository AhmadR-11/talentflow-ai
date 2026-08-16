import { Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8 animate-fadeIn">
      {/* Top Header Skeleton */}
      <div className="flex justify-between items-center pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg bg-slate-200" />
          <Skeleton className="h-4 w-96 rounded-md bg-slate-200" />
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500 animate-spin" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading...</span>
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
            <Skeleton className="h-4 w-28 rounded bg-slate-200" />
            <Skeleton className="h-9 w-20 rounded-md bg-slate-200" />
            <Skeleton className="h-3 w-36 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Content Section Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48 rounded-md bg-slate-200" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48 bg-slate-200" />
                <Skeleton className="h-6 w-24 rounded-full bg-slate-200" />
              </div>
              <Skeleton className="h-4 w-64 bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
