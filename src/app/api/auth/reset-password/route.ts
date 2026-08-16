import { hash } from "bcryptjs"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const { token, password } = await request.json().catch(() => ({ token: "", password: "" }))

  if (!token || !password || String(password).length < 8) {
    return NextResponse.json(
      { error: "A valid reset token and password are required." },
      { status: 400 }
    )
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: String(token) },
    include: { hrManager: true },
  })

  if (!resetToken) {
    return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 })
  }

  if (resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 })
  }

  const passwordHash = await hash(String(password), 12)

  await prisma.$transaction([
    prisma.hrManager.update({
      where: { id: resetToken.hrManagerId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ ok: true })
}
