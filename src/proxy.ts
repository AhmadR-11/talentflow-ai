import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { auth } from "@/auth"

export async function proxy(request: NextRequest) {
  const session = await auth()
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard")

  if (!session?.user && isDashboardRoute) {
    const returnUrl = encodeURIComponent(
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    )

    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${returnUrl}`, request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}