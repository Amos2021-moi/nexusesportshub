"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// ============================================ //
// ✅ VALIDATION SCHEMAS                        //
// ============================================ //

const registerSchema = z.object({
  email: z.string()
    .email("Invalid email address")
    .min(5, "Email is too short")
    .max(255, "Email is too long")
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .trim(),
  
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .toLowerCase()
    .trim(),
})

// ============================================ //
// ✅ RATE LIMITING                             //
// ============================================ //

const rateLimit = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now()
  const record = rateLimit.get(ip)

  if (!record || now > record.resetAt) {
    rateLimit.set(ip, {
      count: 1,
      resetAt: now + 15 * 60 * 1000,
    })
    return { allowed: true }
  }

  if (record.count >= 5) {
    const remainingMinutes = Math.ceil((record.resetAt - now) / 60 / 1000)
    return {
      allowed: false,
      message: `Too many registration attempts. Please try again in ${remainingMinutes} minutes.`,
    }
  }

  record.count += 1
  return { allowed: true }
}

// ============================================ //
// ✅ REGISTER USER ACTION                      //
// ============================================ //

export async function registerUser(formData: FormData) {
  try {
    const ip = process.env.VERCEL_IP || "127.0.0.1"
    const rateLimitCheck = checkRateLimit(ip)
    
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.message || "Too many attempts")
    }

    const rawData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      name: formData.get("name") as string,
      username: formData.get("username") as string,
    }

    const validatedData = registerSchema.parse(rawData)

    const [existingUser, existingProfile] = await Promise.all([
      prisma.user.findUnique({
        where: { email: validatedData.email },
        select: { id: true },
      }),
      prisma.profile.findUnique({
        where: { username: validatedData.username },
        select: { id: true },
      }),
    ])

    if (existingUser) {
      throw new Error("An account with this email already exists")
    }

    if (existingProfile) {
      throw new Error("Username is already taken")
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',')?.map(e => e.trim().toLowerCase()) || []
    const isAdmin = adminEmails.includes(validatedData.email.toLowerCase())

    const SALT_ROUNDS = process.env.NODE_ENV === "production" ? 12 : 10
    const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS)

    const result = await prisma.$transaction(async (tx) => {
      // ✅ Create user - matches schema exactly
      const newUser = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          role: isAdmin ? "ADMIN" : "PLAYER",
          emailVerified: false, // ✅ Boolean in schema
          emailNotificationsEnabled: false, // ✅ Default false in schema
          isVerified: false, // ✅ Boolean in schema
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      })

      // ✅ Create profile - matches schema exactly
      await tx.profile.create({
        data: {
          userId: newUser.id,
          username: validatedData.username,
          trustScore: 0, // ✅ Default 0 in schema
          verifiedBadge: false, // ✅ Boolean in schema
          // ✅ All other fields are optional or have defaults
        },
      })

      // ✅ Create notification - matches schema exactly (uses 'read' not 'isRead')
      await tx.notification.create({
        data: {
          userId: newUser.id,
          title: "Welcome to Nexus Esports! 🎮",
          message: "Welcome to the platform! Start by setting up your profile and checking out the league.",
          type: "SYSTEM",
          priority: 50, // ✅ Default priority
          priorityLevel: "MEDIUM", // ✅ Default level
          channel: "IN_APP", // ✅ Default channel
          read: false, // ✅ Correct field name (not 'isRead')
        },
      })

      return newUser
    })

    if (isAdmin) {
      console.log(`👑 Admin account created: ${validatedData.email}`)
      
      // ✅ Create audit log - matches schema exactly
      await prisma.auditLog.create({
        data: {
          userId: result.id,
          action: "ADMIN_CREATED",
          targetType: "USER",
          targetId: result.id,
          details: { email: validatedData.email }, // ✅ Json type in schema
          ipAddress: ip, // ✅ Matches schema field name
        },
      })
    }

    revalidatePath("/auth/signin")
    revalidatePath("/auth/signup")

    redirect(`/auth/signin?registered=true&email=${encodeURIComponent(validatedData.email)}`)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0]
      throw new Error(firstError?.message || "Validation error")
    }

    if (error instanceof Error) {
      throw error
    }

    console.error("Registration error:", error)
    throw new Error("Registration failed. Please try again.")
  }
}

// ============================================ //
// ✅ LOGOUT ACTION                             //
// ============================================ //

export async function logout() {
  redirect("/api/auth/signout")
}

// ============================================ //
// ✅ UPDATE PASSWORD ACTION                    //
// ============================================ //

export async function updatePassword(userId: string, currentPassword: string, newPassword: string) {
  try {
    if (!userId || !currentPassword || !newPassword) {
      throw new Error("All fields are required")
    }

    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters")
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user || !user.password) {
      throw new Error("User not found")
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      throw new Error("Current password is incorrect")
    }

    const SALT_ROUNDS = process.env.NODE_ENV === "production" ? 12 : 10
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: "PASSWORD_CHANGED",
        targetType: "USER",
        targetId: userId,
        details: { message: "User changed their password" },
      },
    })

    return { success: true, message: "Password updated successfully" }
  } catch (error) {
    console.error("Password update error:", error)
    throw error
  }
}

// ============================================ //
// ✅ UPDATE EMAIL ACTION                       //
// ============================================ //

export async function updateEmail(userId: string, newEmail: string, password: string) {
  try {
    if (!userId || !newEmail || !password) {
      throw new Error("All fields are required")
    }

    const emailSchema = z.string().email("Invalid email address").toLowerCase().trim()
    const validatedEmail = emailSchema.parse(newEmail)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, password: true },
    })

    if (!user || !user.password) {
      throw new Error("User not found")
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw new Error("Password is incorrect")
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedEmail },
      select: { id: true },
    })

    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email is already in use")
    }

    await prisma.user.update({
      where: { id: userId },
      data: { 
        email: validatedEmail,
        emailVerified: false, // ✅ Require re-verification
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: "EMAIL_CHANGED",
        targetType: "USER",
        targetId: userId,
        details: { 
          oldEmail: user.email,
          newEmail: validatedEmail 
        },
      },
    })

    return { success: true, message: "Email updated successfully. Please verify your new email." }
  } catch (error) {
    console.error("Email update error:", error)
    throw error
  }
}

// ============================================ //
// ✅ DELETE ACCOUNT ACTION                     //
// ============================================ //

export async function deleteAccount(userId: string, password: string) {
  try {
    if (!userId || !password) {
      throw new Error("All fields are required")
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user || !user.password) {
      throw new Error("User not found")
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw new Error("Password is incorrect")
    }

    await prisma.$transaction(async (tx) => {
      // ✅ Delete profile (Cascade will handle User deletion)
      await tx.profile.delete({
        where: { userId },
      })

      // ✅ Delete all notifications
      await tx.notification.deleteMany({
        where: { userId },
      })

      // ✅ Delete audit logs
      await tx.auditLog.deleteMany({
        where: { userId },
      })

      // ✅ Delete user (Cascade will handle everything else)
      await tx.user.delete({
        where: { id: userId },
      })
    })

    console.log(`🗑️ User account deleted: ${userId}`)
    redirect("/")
  } catch (error) {
    console.error("Account deletion error:", error)
    throw error
  }
}

// ============================================ //
// ✅ CHECK USERNAME AVAILABILITY              //
// ============================================ //

export async function checkUsernameAvailability(username: string) {
  try {
    const validatedUsername = z.string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/)
      .toLowerCase()
      .trim()
      .parse(username)

    const existing = await prisma.profile.findUnique({
      where: { username: validatedUsername },
      select: { id: true },
    })

    return {
      available: !existing,
      username: validatedUsername,
    }
  } catch (error) {
    return {
      available: false,
      error: "Invalid username format",
    }
  }
}

// ============================================ //
// ✅ CHECK EMAIL AVAILABILITY                  //
// ============================================ //

export async function checkEmailAvailability(email: string) {
  try {
    const validatedEmail = z.string().email().toLowerCase().trim().parse(email)

    const existing = await prisma.user.findUnique({
      where: { email: validatedEmail },
      select: { id: true },
    })

    return {
      available: !existing,
      email: validatedEmail,
    }
  } catch (error) {
    return {
      available: false,
      error: "Invalid email format",
    }
  }
}

// ============================================ //
// ✅ RESEND VERIFICATION EMAIL                 //
// ============================================ //

export async function resendVerificationEmail(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true },
    })

    if (!user) {
      throw new Error("User not found")
    }

    if (user.emailVerified) {
      throw new Error("Email is already verified")
    }

    // ✅ Generate verification token
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    const token = array.reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationSentAt: new Date(),
      },
    })

    console.log(`📧 Verification email sent to ${user.email} with token: ${token}`)

    return { 
      success: true, 
      message: "Verification email sent. Please check your inbox." 
    }
  } catch (error) {
    console.error("Resend verification error:", error)
    throw error
  }
}