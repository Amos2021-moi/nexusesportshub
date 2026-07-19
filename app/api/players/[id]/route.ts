import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  // ✅ params is a Promise
) {
  try {
    const { id } = await params  // ✅ Await the params
    const session = await getServerSession(authOptions)

    console.log("📊 Fetching profile for ID:", id)

    // Get user with profile and related data
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        squads: {
          orderBy: { createdAt: 'desc' }
        },
        awards: {
          include: {
            season: true
          },
          orderBy: { awardedAt: 'desc' }
        },
        leagueEntries: {
          include: {
            season: true
          },
          orderBy: {
            season: {
              startDate: 'desc'
            }
          }
        },
        homeFixtures: {
          where: { status: "COMPLETED" },
          include: {
            awayPlayer: {
              include: { profile: true }
            },
            result: true
          },
          orderBy: { scheduledDate: 'desc' },
          take: 10
        },
        awayFixtures: {
          where: { status: "COMPLETED" },
          include: {
            homePlayer: {
              include: { profile: true }
            },
            result: true
          },
          orderBy: { scheduledDate: 'desc' },
          take: 10
        }
      }
    })

    if (!user || !user.profile) {
      console.log("❌ User not found for ID:", id)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // ✅ Fetch privacy settings for this user
    const privacySettings = await prisma.setting.findMany({
      where: {
        userId: user.id,
        category: "privacy"
      }
    })

    // ✅ Build privacy settings object with defaults
    const privacy = {
      publicProfile: true,
      showSquad: true,
      showStats: true,
      showLastSeen: true,
      allowComments: true
    }

    // ✅ Apply saved settings
    privacySettings.forEach(setting => {
      if (setting.key in privacy) {
        privacy[setting.key as keyof typeof privacy] = JSON.parse(setting.value)
      }
    })

    // ✅ Determine who is viewing
    const viewerId = session?.user?.id
    const isOwnProfile = viewerId === user.id
    const isAdmin = session?.user?.role === "ADMIN"

    // ✅ Can view full profile?
    const canViewProfile = privacy.publicProfile || isOwnProfile || isAdmin

    // ✅ If profile is private and viewer is not owner/admin, return limited data
    if (!canViewProfile) {
      return NextResponse.json({
        id: user.id,
        username: user.profile.username,
        name: user.name,
        profilePicture: user.profile.profilePicture,
        bannerImage: user.profile.bannerImage,
        bio: user.profile.bio,
        class: user.profile.class,
        favoriteClub: user.profile.favoriteClub,
        preferredFormation: user.profile.preferredFormation,
        preferredPlaystyle: user.profile.preferredPlaystyle,
        isVerified: user.isVerified,
        trustScore: user.profile.trustScore || 0,
        verifiedBadge: user.profile.verifiedBadge || false,
        totalWins: 0,
        totalDraws: 0,
        totalLosses: 0,
        totalPoints: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        matchesPlayed: 0,
        winRate: 0,
        whatsappNumber: null,
        whatsappVisible: false,
        awards: [],
        squads: [],
        recentMatches: [],
        seasonStats: [],
        privacySettings: privacy,
        isPrivate: true
      })
    }

    // ✅ Can view stats?
    const canViewStats = privacy.showStats || isOwnProfile || isAdmin
    const canViewSquads = privacy.showSquad || isOwnProfile || isAdmin

    // ✅ Create a unified matches array with proper opponent data
    const allMatches: any[] = []

    for (const fixture of user.homeFixtures) {
      allMatches.push({
        ...fixture,
        isHome: true,
        opponent: fixture.awayPlayer,
        opponentName: fixture.awayPlayer?.profile?.username || fixture.awayPlayer?.name || "Unknown"
      })
    }

    for (const fixture of user.awayFixtures) {
      allMatches.push({
        ...fixture,
        isHome: false,
        opponent: fixture.homePlayer,
        opponentName: fixture.homePlayer?.profile?.username || fixture.homePlayer?.name || "Unknown"
      })
    }

    allMatches.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())

    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0
    let matchesPlayed = 0

    if (canViewStats) {
      for (const match of allMatches) {
        const myScore = match.isHome ? match.result?.homeScore : match.result?.awayScore
        const oppScore = match.isHome ? match.result?.awayScore : match.result?.homeScore

        if (myScore !== undefined && oppScore !== undefined) {
          matchesPlayed++
          goalsFor += myScore
          goalsAgainst += oppScore
          if (myScore > oppScore) wins++
          else if (myScore < oppScore) losses++
          else draws++
        }
      }
    }

    const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0
    const goalDifference = goalsFor - goalsAgainst
    const totalPoints = canViewStats ? user.profile.totalPoints || 0 : 0

    const recentMatches = canViewStats ? allMatches.slice(0, 10).map(match => {
      let result = "D"
      const myScore = match.isHome ? match.result?.homeScore : match.result?.awayScore
      const oppScore = match.isHome ? match.result?.awayScore : match.result?.homeScore
      
      if (myScore !== undefined && oppScore !== undefined) {
        if (myScore > oppScore) result = "W"
        else if (myScore < oppScore) result = "L"
        else result = "D"
      }

      return {
        id: match.id,
        opponentName: match.opponentName,
        score: myScore !== undefined && oppScore !== undefined ? `${myScore}-${oppScore}` : "Pending",
        result,
        date: match.scheduledDate
      }
    }) : []

    const seasonStats = canViewStats ? user.leagueEntries.map(entry => ({
      seasonName: entry.season.name,
      points: entry.points,
      wins: entry.wins,
      draws: entry.draws,
      losses: entry.losses,
      goalsFor: entry.goalsFor,
      goalsAgainst: entry.goalsAgainst
    })) : []

    const awards = canViewStats ? user.awards.map(award => ({
      name: award.name,
      seasonName: award.season.name
    })) : []

    const squads = canViewSquads ? user.squads.map(squad => ({
      id: squad.id,
      type: squad.type,
      screenshot: squad.screenshot,
      formation: squad.formation,
      teamStrength: squad.teamStrength,
      playstyle: squad.playstyle
    })) : []

    return NextResponse.json({
      id: user.id,
      username: user.profile.username,
      name: user.name,
      profilePicture: user.profile.profilePicture,
      bannerImage: user.profile.bannerImage,
      bio: user.profile.bio,
      class: user.profile.class,
      favoriteClub: user.profile.favoriteClub,
      preferredFormation: user.profile.preferredFormation,
      preferredPlaystyle: user.profile.preferredPlaystyle,
      isVerified: user.isVerified,
      trustScore: user.profile.trustScore || 0,
      verifiedBadge: user.profile.verifiedBadge || false,
      totalWins: wins,
      totalDraws: draws,
      totalLosses: losses,
      totalPoints,
      goalsFor,
      goalsAgainst,
      goalDifference,
      matchesPlayed,
      winRate,
      whatsappNumber: user.profile.whatsappNumber || null,
      whatsappVisible: user.profile.whatsappVisible || false,
      awards,
      squads,
      recentMatches,
      seasonStats,
      privacySettings: privacy,
      isPrivate: false
    })
  } catch (error) {
    console.error("Error fetching player profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch player profile" },
      { status: 500 }
    )
  }
}