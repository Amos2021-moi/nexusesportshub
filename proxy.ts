import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ✅ Get the session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // ✅ Redirect admin to admin dashboard if they try to go to player dashboard
  if (path === "/dashboard" && token?.role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // ✅ Redirect player to player dashboard if they try to go to admin
  if (path === "/admin" && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // ✅ Admin routes protection - only ADMIN role can access
  if (path.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // ✅ Dashboard routes - allow both admin and player
  if (path.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }
  }

  // ✅ API admin routes protection
  if (path.startsWith("/api/admin")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (token.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  // ✅ FIX: Add no-cache headers to ALL API responses
  if (path.startsWith("/api/")) {
    const response = NextResponse.next()
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/admin",
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/competition/:path*",
    "/api/:path*", // ✅ Added to catch ALL API routes
  ],
}