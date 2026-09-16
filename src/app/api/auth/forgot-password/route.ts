import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { createResetTokenExpiry, generateSecureToken } from "@/lib/tokens"
import { sendPasswordResetEmail } from "@/lib/resend"
import { validateAuthenticHrEmail } from "@/lib/email-validator"

export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({ email: "" }))
  const normalizedEmail = String(email ?? "").trim().toLowerCase()

  if (!normalizedEmail) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 })
  }

  // Validate that the email address format and domain are authentic
  const emailValidation = await validateAuthenticHrEmail(normalizedEmail)
  if (!emailValidation.isValid) {
    return NextResponse.json(
      { error: emailValidation.reason || "Please enter a valid, authentic email address." },
      { status: 400 }
    )
  }

  const hrManager = await prisma.hrManager.findUnique({
    where: { email: normalizedEmail },
  })

  if (!hrManager) {
    return NextResponse.json({ ok: true })
  }

  const token = generateSecureToken()
  const expiresAt = createResetTokenExpiry()

  await prisma.passwordResetToken.create({
    data: {
      hrManagerId: hrManager.id,
      token,
      expiresAt,
    },
  })

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`

  await sendPasswordResetEmail(normalizedEmail, resetUrl)

  return NextResponse.json({ ok: true })
}
