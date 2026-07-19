import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Get user with profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // ✅ Return profile with isVerified from User table
    return NextResponse.json({
      ...user.profile,
      isVerified: user.isVerified,
      verifiedBadge: user.profile.verifiedBadge,
      name: user.name,
      email: user.email
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      username,
      name,
      class: playerClass,
      bio,
      favoriteClub,
      preferredFormation,
      preferredPlaystyle,
      profilePicture,
      bannerImage,
      whatsappNumber,
      whatsappVisible
    } = body

    // Update profile
    const profile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        username,
        class: playerClass,
        bio,
        favoriteClub,
        preferredFormation,
        preferredPlaystyle,
        profilePicture,
        bannerImage,
        whatsappNumber,
        whatsappVisible
      }
    })

    // Update user name
    if (name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name }
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true }
    })

    return NextResponse.json({
      ...profile,
      isVerified: user?.isVerified || false,
      verifiedBadge: profile.verifiedBadge,
      name: user?.name,
      email: user?.email
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}