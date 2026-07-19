import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { notificationWithEmailService } from "@/lib/services/notificationWithEmail.service"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

   const user = await prisma.user.findFirst({
  where: {
    // @ts-ignore - These fields exist after migration
    resetPasswordToken: token,
    // @ts-ignore - These fields exist after migration
    resetPasswordExpiresAt: {
      gt: new Date()
    }
  }
})

    if (!user) {
      return NextResponse.json({
        error: "Invalid or expired reset link"
      }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordSentAt: null,
        resetPasswordExpiresAt: null
      }
    })

    // ✅ Send notification that password was successfully reset
    await notificationWithEmailService.sendNotificationWithEmail({
      userId: user.id,
      type: "SYSTEM_ALERT",
      title: "🔐 Password Reset Successful",
      message: "Your password has been successfully reset. If you didn't do this, please contact support immediately.",
      priority: "HIGH",
      data: {
        link: process.env.NEXTAUTH_URL + "/auth/signin",
        customMessage: "Your password was changed successfully. You can now sign in with your new password."
      },
      emailTemplate: "notification",
      emailSubject: "🔐 Password Reset Successful - Nexus Esports"
    })

    return NextResponse.json({
      success: true,
      message: "Password reset successfully"
    })

  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}