"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function NavigationProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    // When pathname or searchParams change, navigation completed
    setIsNavigating(false)
  }, [pathname, searchParams])

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement
      if (
        target &&
        target.href &&
        target.href.startsWith(window.location.origin) &&
        !target.href.includes("#") &&
        target.target !== "_blank"
      ) {
        const url = new URL(target.href)
        if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
          setIsNavigating(true)
        }
      }
    }

    // Attach click listener to all internal links
    const links = document.querySelectorAll("a[href]")
    links.forEach((link) => {
      link.addEventListener("click", handleAnchorClick as EventListener)
    })

    return () => {
      links.forEach((link) => {
        link.removeEventListener("click", handleAnchorClick as EventListener)
      })
    }
  }, [pathname, searchParams])

  if (!isNavigating) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 pointer-events-none overflow-hidden bg-slate-100">
      <div className="h-full w-full bg-gradient-to-r from-emerald-500 via-indigo-600 to-emerald-400 animate-pulse transition-all duration-300" />
    </div>
  )
}
