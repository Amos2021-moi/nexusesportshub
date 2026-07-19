import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { cache } from "react"

// ============================================ //
// ✅ TYPE DEFINITIONS                          //
// ============================================ //

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      verifiedBadge?: boolean
      trustScore?: number
    }
  }

  interface User {
    id: string
    role: string
    verifiedBadge?: boolean
    trustScore?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    accessToken?: string
    verifiedBadge?: boolean
    trustScore?: number
    lastRefresh?: number
  }
}

// ============================================ //
// ✅ CACHED USER FETCH                         //
// ============================================ //

const getUserByEmail = cache(async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true,
      emailVerified: true,
      emailNotificationsEnabled: true,
      isVerified: true,
      profile: {
        select: {
          verifiedBadge: true,
          trustScore: true,
          username: true,
        },
      },
    },
  })
})

// ============================================ //
// ✅ SOCIAL LOGIN HELPER                       //
// ============================================ //

async function handleSocialLogin(
  email: string,
  name: string | null | undefined,
  provider: string
) {
  if (!email) {
    throw new Error("Email is required for social login")
  }

  const existingUser = await getUserByEmail(email)

  if (!existingUser) {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: name || `${provider} User`,
          role: "PLAYER",
          emailVerified: true,
          isVerified: true,
          emailNotificationsEnabled: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      })

      const baseUsername = email.split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
      const randomSuffix = Math.floor(Math.random() * 10000)
      const username = `${baseUsername}${randomSuffix}`

      await tx.profile.create({
        data: {
          userId: user.id,
          username,
          trustScore: 0,
          verifiedBadge: false,
        },
      })

      return tx.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          profile: {
            select: {
              verifiedBadge: true,
              trustScore: true,
            },
          },
        },
      })
    })

    return {
      id: result!.id,
      email: result!.email,
      name: result!.name,
      role: result!.role,
      verifiedBadge: result!.profile?.verifiedBadge || false,
      trustScore: result!.profile?.trustScore || 0,
    }
  }

  if (name && name !== existingUser.name) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { name },
    })
  }

  return {
    id: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    role: existingUser.role,
    verifiedBadge: existingUser.profile?.verifiedBadge || false,
    trustScore: existingUser.profile?.trustScore || 0,
  }
}

// ============================================ //
// ✅ AUTH OPTIONS                              //
// ============================================ //

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      httpOptions: {
        timeout: 30000,
      },
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "PLAYER",
        }
      },
    }),

    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      httpOptions: {
        timeout: 30000,
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
          role: "PLAYER",
        }
      },
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }

        const email = credentials.email.trim().toLowerCase()
        const password = credentials.password.trim()

        if (!email || !password) {
          throw new Error("Invalid credentials")
        }

        const user = await getUserByEmail(email)

        if (!user || !user.password) {
          throw new Error("Invalid email or password")
        }

        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) {
          throw new Error("Invalid email or password")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          verifiedBadge: user.profile?.verifiedBadge || false,
          trustScore: user.profile?.trustScore || 0,
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google" || account?.provider === "facebook") {
          const socialUser = await handleSocialLogin(
            user.email!,
            user.name,
            account.provider
          )

          user.id = socialUser.id
          user.role = socialUser.role
          user.verifiedBadge = socialUser.verifiedBadge
          user.trustScore = socialUser.trustScore

          return true
        }

        return true
      } catch (error) {
        console.error(`❌ ${account?.provider} sign in error:`, error)
        return false
      }
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.verifiedBadge = user.verifiedBadge
        token.trustScore = user.trustScore
      }

      if (account) {
        token.accessToken = account.access_token
      }

      const now = Date.now()
      const lastRefresh = token.lastRefresh as number || 0
      const REFRESH_INTERVAL = 30 * 60 * 1000

      if (token.id && now - lastRefresh > REFRESH_INTERVAL) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              role: true,
              profile: {
                select: {
                  verifiedBadge: true,
                  trustScore: true,
                },
              },
            },
          })

          if (freshUser) {
            token.role = freshUser.role
            token.verifiedBadge = freshUser.profile?.verifiedBadge || false
            token.trustScore = freshUser.profile?.trustScore || 0
            token.lastRefresh = now
          }
        } catch (error) {
          console.error("❌ Failed to refresh JWT:", error)
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.verifiedBadge = token.verifiedBadge as boolean
        session.user.trustScore = token.trustScore as number
      }
      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    signOut: "/auth/signout",
    verifyRequest: "/auth/verify-request",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  // ✅ CRITICAL FIX: Use secure cookies settings
  useSecureCookies: process.env.NODE_ENV === "production",
  
  // ✅ Add cookie configuration
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.callback-url"
        : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Host-next-auth.csrf-token"
        : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    pkceCodeVerifier: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.pkce.code_verifier"
        : "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    state: {
      name: process.env.NODE_ENV === "production"
        ? "__Host-next-auth.state"
        : "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

// ============================================ //
// ✅ HELPER FUNCTIONS                          //
// ============================================ //

import { getServerSession } from "next-auth"

export const getCachedSession = cache(async () => {
  return getServerSession(authOptions)
})

export async function getCurrentUser() {
  const session = await getCachedSession()
  
  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      emailNotificationsEnabled: true,
      isVerified: true,
      profile: {
        select: {
          username: true,
          profilePicture: true,
          bio: true,
          verifiedBadge: true,
          trustScore: true,
        },
      },
    },
  })

  return user
}

export async function isAdmin() {
  const session = await getCachedSession()
  return session?.user?.role === "ADMIN"
}

export async function isAuthenticated() {
  const session = await getCachedSession()
  return !!session?.user
}

export async function getUserRole() {
  const session = await getCachedSession()
  return session?.user?.role || null
}

export async function requireAuth() {
  const session = await getCachedSession()
  
  if (!session?.user) {
    throw new Error("Unauthorized: Please login")
  }
  
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required")
  }
  
  return session
}