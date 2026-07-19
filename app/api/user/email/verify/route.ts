import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { emailService } from "@/lib/services/email.service"
import crypto from "crypto"

// ✅ Send verification email
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Please login" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ 
        message: "Email already verified" 
      }, { status: 400 })
    }

    // Rate limit: 1 email per 5 minutes
    if (user.lastEmailSentAt && Date.now() - user.lastEmailSentAt.getTime() < 300000) {
      return NextResponse.json({
        error: "Please wait 5 minutes before requesting another verification"
      }, { status: 429 })
    }

    const token = crypto.randomBytes(32).toString('hex')

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationSentAt: new Date(),
        lastEmailSentAt: new Date()
      }
    })

    await emailService.sendVerificationEmail(
      user.email,
      user.name || "Player",
      token
    )

    return NextResponse.json({
      success: true,
      message: "Verification email sent! Check your inbox."
    })

  } catch (error) {
    console.error("Error sending verification:", error)
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    )
  }
}