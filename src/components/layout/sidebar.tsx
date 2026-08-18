"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
  const [isHovered, setIsHovered] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  const isExpanded = isHovered || isPinned

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
    <motion.aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
      animate={{ width: isExpanded ? 256 : 80 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="relative flex h-screen flex-col border-r border-slate-200 bg-white text-slate-800 z-40 shrink-0 overflow-hidden shadow-2xs"
    >
      {/* ───────── Clickable Brand Logo Header ───────── */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 shrink-0 overflow-hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80 shrink-0"
          title="Go to Dashboard Overview"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>

          <AnimatePresence initial={false}>
            {isExpanded ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap flex items-center"
              >
                <span className="text-base font-bold tracking-tight text-slate-900">
                  TalentFlow
                </span>
                <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                  AI
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Link>

        {/* Pin / Expand Toggle Button */}
        <AnimatePresence initial={false}>
          {isExpanded ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              type="button"
              onClick={() => setIsPinned((prev) => !prev)}
              className={`h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0 ${
                isPinned ? "bg-slate-100 text-slate-800" : ""
              }`}
              title={isPinned ? "Unpin sidebar (auto-collapse)" : "Pin sidebar expanded"}
            >
              {isPinned ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ───────── Navigation Menu ───────── */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-2 overflow-x-hidden">
        <AnimatePresence initial={false}>
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap"
            >
              Main Menu
            </motion.div>
          ) : null}
        </AnimatePresence>

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
                className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                title={item.title}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    isActive ? "text-emerald-400" : "text-slate-400"
                  }`}
                />
                <AnimatePresence initial={false}>
                  {isExpanded ? (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap truncate"
                    >
                      {item.title}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* ───────── User Footer Profile & Sign Out ───────── */}
      <div className="border-t border-slate-100 p-3 shrink-0 overflow-hidden space-y-2">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 border border-slate-100 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-xs">
            <User className="h-4 w-4" />
          </div>

          <AnimatePresence initial={false}>
            {isExpanded ? (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="truncate whitespace-nowrap"
              >
                <p className="truncate text-xs font-bold text-slate-900">
                  {user?.name || "HR Manager"}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {user?.email || "hr@talentflow.ai"}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <DashboardLogoutButton isExpanded={isExpanded} />
      </div>
    </motion.aside>
  )
}
