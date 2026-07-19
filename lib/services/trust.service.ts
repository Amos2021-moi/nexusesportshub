import { prisma } from "@/lib/prisma"

interface TrustFactors {
  matchCompletion: number
  resultConsistency: number
  reportAccuracy: number
  activityLevel: number
  sportsmanship: number
}

export async function calculateTrustScore(userId: string): Promise<number> {
  try {
    const factors = await getTrustFactors(userId)
    
    // Weighted calculation
    const weights = {
      matchCompletion: 0.30,
      resultConsistency: 0.25,
      reportAccuracy: 0.20,
      activityLevel: 0.15,
      sportsmanship: 0.10
    }

    let score = 0
    score += factors.matchCompletion * weights.matchCompletion
    score += factors.resultConsistency * weights.resultConsistency
    score += factors.reportAccuracy * weights.reportAccuracy
    score += factors.activityLevel * weights.activityLevel
    score += factors.sportsmanship * weights.sportsmanship

    // Round to nearest integer, cap at 100
    return Math.min(Math.round(score), 100)
  } catch (error) {
    console.error("Error calculating trust score:", error)
    return 0
  }
}

export async function getTrustFactors(userId: string): Promise<TrustFactors> {
  try {
    // Get user's matches
    const fixtures = await prisma.fixture.findMany({
      where: {
        OR: [
          { homePlayerId: userId },
          { awayPlayerId: userId }
        ]
      },
      include: {
        result: true
      }
    })

    const totalFixtures = fixtures.length
    const completedFixtures = fixtures.filter(f => f.status === "COMPLETED").length
    const pendingFixtures = fixtures.filter(f => f.status === "PENDING").length
    const scheduledFixtures = fixtures.filter(f => f.status === "SCHEDULED").length

    // 1. Match Completion Rate (30%)
    const matchCompletion = totalFixtures > 0 ? (completedFixtures / totalFixtures) * 100 : 50

    // 2. Result Consistency (25%)
    // Check if player consistently reports results
    const submittedResults = await prisma.result.count({
      where: {
        submittedBy: userId,
        approved: true
      }
    })
    const resultConsistency = totalFixtures > 0 ? Math.min((submittedResults / totalFixtures) * 100, 100) : 50

    // 3. Report Accuracy (20%)
    // Check if results are approved vs rejected
    const approvedResults = await prisma.result.count({
      where: {
        submittedBy: userId,
        approved: true
      }
    })
    const rejectedResults = await prisma.result.count({
      where: {
        submittedBy: userId,
        approved: false
      }
    })
    const totalSubmitted = approvedResults + rejectedResults
    const reportAccuracy = totalSubmitted > 0 ? (approvedResults / totalSubmitted) * 100 : 70

    // 4. Activity Level (15%)
    // Check recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentActivity = await prisma.fixture.count({
      where: {
        OR: [
          { homePlayerId: userId },
          { awayPlayerId: userId }
        ],
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })
    const activityLevel = Math.min((recentActivity / 5) * 100, 100)

    // 5. Sportsmanship (10%)
    // Based on completed matches without issues
    const cleanMatches = await prisma.fixture.count({
      where: {
        OR: [
          { homePlayerId: userId },
          { awayPlayerId: userId }
        ],
        status: "COMPLETED",
        result: {
          isNot: null
        }
      }
    })
    const sportsmanship = completedFixtures > 0 ? (cleanMatches / completedFixtures) * 100 : 50

    return {
      matchCompletion,
      resultConsistency,
      reportAccuracy,
      activityLevel,
      sportsmanship
    }
  } catch (error) {
    console.error("Error getting trust factors:", error)
    return {
      matchCompletion: 50,
      resultConsistency: 50,
      reportAccuracy: 70,
      activityLevel: 50,
      sportsmanship: 50
    }
  }
}

export async function updateTrustScore(userId: string): Promise<number> {
  try {
    const score = await calculateTrustScore(userId)
    
    await prisma.profile.update({
      where: { userId },
      data: { trustScore: score }
    })

    // Auto-verify if trust score >= 80
    if (score >= 80) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isVerified: true,
          verifiedAt: new Date()
        }
      })
      await prisma.profile.update({
        where: { userId },
        data: { verifiedBadge: true }
      })
    }

    return score
  } catch (error) {
    console.error("Error updating trust score:", error)
    return 0
  }
}

export async function updateAllTrustScores(): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: { role: "PLAYER" },
      include: { profile: true }
    })

    for (const user of users) {
      if (user.profile) {
        await updateTrustScore(user.id)
      }
    }
  } catch (error) {
    console.error("Error updating all trust scores:", error)
  }
}