import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signUpSchema } from "@/lib/validators/auth";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = signUpSchema.parse(body);
    const { name, username, email, password } = validatedData;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { profile: { username } }
        ]
      },
      include: { profile: true }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: "EmailExists", message: "An account with this email already exists" },
          { status: 409 }
        );
      }
      if (existingUser.profile?.username === username) {
        return NextResponse.json(
          { error: "UsernameTaken", message: "This username is already taken" },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "PLAYER",
        emailNotificationsEnabled: true,
      },
    });

    // Create profile
    await prisma.profile.create({
      data: {
        userId: newUser.id,
        username,
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Account created successfully! Please sign in.",
        userId: newUser.id 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Signup error:", error);
    
    if (error instanceof ZodError) {
      let errorMessage = "Validation error";
      if (error.issues && error.issues.length > 0) {
        errorMessage = error.issues.map(e => e.message).join(", ");
      }
      return NextResponse.json(
        { error: "ValidationError", message: errorMessage },
        { status: 422 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: "ServerError", message: error.message || "Internal server error" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "ServerError", message: "Internal server error" },
      { status: 500 }
    );
  }
}