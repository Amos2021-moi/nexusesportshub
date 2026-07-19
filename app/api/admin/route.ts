import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }
    
    const user = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" }
    })
    
    return NextResponse.json({ success: true, email: user.email, role: user.role })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
}