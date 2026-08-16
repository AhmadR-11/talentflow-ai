"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PlusCircle, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

interface NavbarProps {
  user?: {
    name?: string | null
    email?: string | null
  }
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard Overview"
    if (pathname === "/jobs") return "Job Postings"
    if (pathname === "/jobs/create") return "Create New Job"
    if (pathname.startsWith("/jobs/")) return "Job Details"
    if (pathname === "/settings") return "HR Settings"
    return "HR Dashboard"
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur transition-all">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-slate-900">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        {pathname !== "/jobs/create" ? (
          <Link href="/jobs/create">
            <Button size="sm" className="flex items-center gap-1.5 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              <span>Create Job</span>
            </Button>
          </Link>
        ) : null}

        <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>{user?.name || "HR Manager"}</span>
        </div>
      </div>
    </header>
  )
}
