import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationSentAt: {
          gt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "Invalid or expired verification link"
      }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailNotificationsEnabled: true // Auto-enable on verification
      }
    })

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now receive email notifications."
    })

  } catch (error) {
    console.error("Error verifying email:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to verify email"
    }, { status: 500 })
  }
}