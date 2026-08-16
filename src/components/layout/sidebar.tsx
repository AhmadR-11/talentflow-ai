"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  Settings,
  Sparkles,
  User,
} from "lucide-react"

import { DashboardLogoutButton } from "@/components/dashboard-logout-button"

interface SidebarProps {
  user?: {
    name?: string | null
    email?: string | null
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: "Job Postings",
      href: "/jobs",
      icon: Briefcase,
      exact: true,
    },
    {
      title: "Create New Job",
      href: "/jobs/create",
      icon: PlusCircle,
      exact: false,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      exact: false,
    },
  ]

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white text-slate-800">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          <Sparkles className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            TalentFlow
          </span>
          <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
            AI
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Main Menu
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)

            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Footer Profile & Sign Out */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
              <User className="h-4 w-4" />
            </div>
            <div className="truncate">
              <p className="truncate text-xs font-semibold text-slate-900">
                {user?.name || "HR Manager"}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {user?.email || "hr@talentflow.ai"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <DashboardLogoutButton />
        </div>
      </div>
    </aside>
  )
}
