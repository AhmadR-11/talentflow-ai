import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { Resend } from "resend"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { name, email } = body

    const currentHr = await prisma.hrManager.findUnique({
      where: { id: session.user.id },
    })

    if (!currentHr) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const newName = name ? name.trim() : currentHr.name
    const newEmail = email ? email.trim().toLowerCase() : currentHr.email

    const isEmailChanged = newEmail !== currentHr.email.toLowerCase()

    if (isEmailChanged) {
      // Check if new email is already registered by another account
      const existingUser = await prisma.hrManager.findUnique({
        where: { email: newEmail },
      })

      if (existingUser && existingUser.id !== currentHr.id) {
        return NextResponse.json(
          { error: "This email address is already in use by another account." },
          { status: 400 }
        )
      }

      // Generate email verification token
      const token = randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      await prisma.passwordResetToken.create({
        data: {
          hrManagerId: currentHr.id,
          token,
          expiresAt,
        },
      })

      // Update name if changed
      if (newName !== currentHr.name) {
        await prisma.hrManager.update({
          where: { id: currentHr.id },
          data: { name: newName },
        })
      }

      // Send verification email via Resend if API key present
      if (resend) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const verifyUrl = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(newEmail)}`

        try {
          await resend.emails.send({
            from: "TalentFlow AI <onboarding@resend.dev>",
            to: newEmail,
            subject: "Verify your new email address - TalentFlow AI",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0F172A;">Verify Your New Email Address</h2>
                <p>Hello ${newName},</p>
                <p>You requested to update your TalentFlow AI account email to <strong>${newEmail}</strong>.</p>
                <p>Please click the button below to verify and complete this change:</p>
                <a href="${verifyUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Verify Email Address</a>
                <p style="color: #64748B; font-size: 12px;">This link will expire in 24 hours.</p>
              </div>
            `,
          })
        } catch (emailErr) {
          console.warn("Failed to send verification email:", emailErr)
        }
      }

      return NextResponse.json({
        success: true,
        emailChanged: true,
        message: "Verification email sent to new address. Please check your inbox.",
      })
    }

    // Only name updated
    const updated = await prisma.hrManager.update({
      where: { id: currentHr.id },
      data: { name: newName },
      select: { id: true, name: true, email: true },
    })

    return NextResponse.json({
      success: true,
      emailChanged: false,
      message: "Profile updated successfully.",
      user: updated,
    })
  } catch (error) {
    console.error("Failed to update profile:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
