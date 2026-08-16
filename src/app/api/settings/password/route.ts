import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required." },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      )
    }

    const hrManager = await prisma.hrManager.findUnique({
      where: { id: session.user.id },
    })

    if (!hrManager) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, hrManager.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      )
    }

    // Hash new password and update in DB
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    await prisma.hrManager.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    })

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    })
  } catch (error) {
    console.error("Failed to update password:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
