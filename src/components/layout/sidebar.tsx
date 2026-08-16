"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  Settings,
  Sparkles,
  User,
  PanelLeftClose,
  PanelLeftOpen,
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
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(false)

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
    <aside
      className={`group/sidebar relative flex h-screen flex-col border-r border-slate-200 bg-white text-slate-800 transition-all duration-300 ease-in-out z-40 ${
        isPinnedExpanded ? "w-64" : "w-20 hover:w-64"
      }`}
    >
      {/* ───────── Clickable Brand Logo Header ───────── */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 overflow-hidden shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80"
          title="Go to Dashboard Overview"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="whitespace-nowrap transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100 ${isPinnedExpanded ? 'opacity-100' : ''}">
            <span className="text-base font-bold tracking-tight text-slate-900">
              TalentFlow
            </span>
            <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
              AI
            </span>
          </div>
        </Link>

        {/* Pin / Expand Toggle Button */}
        <button
          type="button"
          onClick={() => setIsPinnedExpanded((prev) => !prev)}
          className="hidden group-hover/sidebar:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title={isPinnedExpanded ? "Unpin sidebar" : "Pin sidebar expanded"}
        >
          {isPinnedExpanded ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* ───────── Navigation Menu ───────── */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-2 overflow-x-hidden">
        <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap transition-opacity duration-300 opacity-0 group-hover/sidebar:opacity-100">
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
                className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                title={item.title}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    isActive ? "text-emerald-400" : "text-slate-400 group-hover/sidebar:text-slate-600"
                  }`}
                />
                <span className="whitespace-nowrap transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100">
                  {item.title}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* ───────── User Footer Profile & Sign Out ───────── */}
      <div className="border-t border-slate-100 p-3 shrink-0 overflow-hidden space-y-2">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-xs">
            <User className="h-4 w-4" />
          </div>
          <div className="truncate whitespace-nowrap transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100">
            <p className="truncate text-xs font-bold text-slate-900">
              {user?.name || "HR Manager"}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              {user?.email || "hr@talentflow.ai"}
            </p>
          </div>
        </div>

        <div className="whitespace-nowrap transition-all duration-300">
          <DashboardLogoutButton />
        </div>
      </div>
    </aside>
  )
}
