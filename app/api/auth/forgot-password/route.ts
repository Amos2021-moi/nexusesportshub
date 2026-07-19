import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { emailService } from "@/lib/services/email.service"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Return success even if user not found (security best practice)
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link has been sent"
      })
    }

    const token = crypto.randomBytes(32).toString('hex')

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordSentAt: new Date(),
        resetPasswordExpiresAt: new Date(Date.now() + 3600000) // 1 hour
      }
    })

    // ✅ Send password reset email
    await emailService.sendPasswordResetEmail(
      user.email,
      user.name || "Player",
      token
    )

    return NextResponse.json({
      success: true,
      message: "Password reset link sent to your email"
    })

  } catch (error) {
    console.error("Error sending reset email:", error)
    return NextResponse.json(
      { error: "Failed to send reset email" },
      { status: 500 }
    )
  }
}