import { prisma } from "@/lib/prisma"

export interface SearchResult {
  type: "season" | "tournament" | "player" | "fixture" | "result" | "payment" | "squad" | "news" | "award" | "hallOfFame"
  id: string
  title: string
  subtitle: string
  status?: string
  date?: string
  url: string
  matchScore: number
  metadata: Record<string, any>
}

export class SearchService {
  /**
   * ✅ Main search method - searches across all entity types
   */
  async search(query: string, limit: number = 20): Promise<{
    results: SearchResult[]
    total: number
    query: string
    time: number
  }> {
    const startTime = Date.now()

    if (!query || query.length < 2) {
      return { results: [], total: 0, query, time: Date.now() - startTime }
    }

    const trimmedQuery = query.trim()
    const searchType = this.detectSearchType(trimmedQuery)

    // ✅ Run all searches in parallel for performance
    const results = await Promise.all([
      this.searchSeasons(trimmedQuery, searchType),
      this.searchTournaments(trimmedQuery, searchType),
      this.searchPlayers(trimmedQuery, searchType),
      this.searchFixtures(trimmedQuery, searchType),
      this.searchResults(trimmedQuery, searchType),
      this.searchPayments(trimmedQuery, searchType),
      this.searchSquads(trimmedQuery, searchType),
      this.searchNews(trimmedQuery, searchType),
      this.searchAwards(trimmedQuery, searchType),
      this.searchHallOfFame(trimmedQuery, searchType),
    ])

    // ✅ Sort by match score (highest first) and flatten
    const allResults = results.flat().sort((a, b) => b.matchScore - a.matchScore)

    return {
      results: allResults.slice(0, limit),
      total: allResults.length,
      query: trimmedQuery,
      time: Date.now() - startTime,
    }
  }

  /**
   * ✅ Detect search type from query format
   */
  private detectSearchType(query: string): "id" | "name" | "generic" {
    // ✅ Pattern: FIX-789, PLY-42, SEA-001, TOR-123
    const idPatterns = [
      /^[A-Z]{2,4}-\d+$/i,
      /^[a-z]+_\d+$/i,
      /^[A-Z0-9]{8,}$/,
    ]

    for (const pattern of idPatterns) {
      if (pattern.test(query)) {
        return "id"
      }
    }

    // ✅ Pattern: "Amos Mark", "John Doe"
    if (/^[a-zA-Z\s]{2,}$/.test(query)) {
      return "name"
    }

    return "generic"
  }

  /**
   * ✅ Search Seasons
   */
  private async searchSeasons(query: string, searchType: string): Promise<SearchResult[]> {
    try {
      const seasons = await prisma.season.findMany({
        where: {
          OR: [
            { id: { contains: query } },
            { name: { contains: query } },
          ],
        },
        include: {
          leagueEntries: { select: { playerId: true }, take: 1 },
          fixtures: { select: { id: true }, take: 1 },
        },
        take: 5,
      })

      return seasons.map((season) => ({
        type: "season",
        id: season.id,
        title: season.name,
        subtitle: `${season.status} • ${season.leagueEntries.length} players • ${season.fixtures.length} fixtures`,
        status: season.status,
        date: season.startDate.toLocaleDateString(),
        url: `/admin/entity/${season.id}`,
        matchScore: this.calculateMatchScore(season.id, query, season.name, searchType),
        metadata: {
          startDate: season.startDate,
          endDate: season.endDate,
          isActive: season.isActive,
          status: season.status,
          playerCount: season.leagueEntries.length,
          fixtureCount: season.fixtures.length,
        },
      }))
    } catch {
      return []
    }
  }

  /**
   * ✅ Search Tournaments
   */
  private async searchTournaments(query: string, searchType: string): Promise<SearchResult[]> {
    try {
      const tournaments = await prisma.tournament.findMany({
        where: {
          OR: [
            { id: { contains: query } },
            { name: { contains: query } },
          ],
        },
        include: {
          participants: { select: { playerId: true }, take: 1 },
          matches: { select: { id: true }, take: 1 },
        },
        take: 5,
      })

      return tournaments.map((tournament) => ({
        type: "tournament",
        id: tournament.id,
        title: tournament.name,
        subtitle: `${tournament.status} • ${tournament.type} • ${tournament.participants.length} players`,
        status: tournament.status,
        date: tournament.startDate.toLocaleDateString(),
        url: `/admin/entity/${tournament.id}`,
        matchScore: this.calculateMatchScore(tournament.id, query, tournament.name, searchType),
        metadata: {
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          type: tournament.type,
          status: tournament.status,
          playerCount: tournament.participants.length,
          maxPlayers: tournament.maxPlayers,
        },
      }))
    } catch {
      return []
    }
  }

  /**
   * ✅ Search Players
   */
  private async searchPlayers(query: string, searchType: string): Promise<SearchResult[]> {
    try {
      const players = await prisma.user.findMany({
        where: {
          OR: [
            { id: { contains: query } },
            { name: { contains: query } },
            { email: { contains: query } },
            { profile: { username: { contains: query } } },
          ],
        },
        include: {
          profile: true,
          leagueEntries: {
            orderBy: { points: 'desc' },
            take: 1,
          },
        },
        take: 10,
      })

      return players.map((player) => {
        const entry = player.leagueEntries[0]
        return {
          type: "player",
          id: player.id,
          title: player.profile?.username || player.name || "Unknown",
          subtitle: `${player.role} • ${entry?.points || 0} points`,
          status: player.isVerified ? "Verified" : "Unverified",
          url: `/admin/entity/${player.id}`,
          matchScore: this.calculateMatchScore(player.id, query, player.profile?.username || player.name || "", searchType),
          metadata: {
            name: player.name,
            email: player.email,
            role: player.role,
            isVerified: player.isVerified,
            trustScore: player.profile?.trustScore || 0,
            points: entry?.points || 0,
            username: player.profile?.username,
          },
        }
      })
    } catch {
      return []
    }
  }

  /**
   * ✅ Search Fixtures
   */
  private async searchFixtures(query: string, searchType: string): Promise<SearchResult[]> {
    try {
      const fixtures = await prisma.fixture.findMany({
        where: {
          OR: [
            { id: { contains: query } },
            { homePlayer: { name: { contains: query } } },
            { awayPlayer: { name: { contains: query } } },
          ],
        },
        include: {
          homePlayer: { include: { profile: true } },
          awayPlayer: { include: { profile: true } },
          season: true,
        },
        take: 10,
      })

      return fixtures.map((fixture) => {
        const homeName = fixture.homePlayer?.profile?.username || fixture.homePlayer?.name || "Home"
        const awayName = fixture.awayPlayer?.profile?.username || fixture.awayPlayer?.name || "Away"
        
        return {
          type: "fixture",
          id: fixture.id,
          title: `${homeName} vs ${awayName}`,
          subtitle: `${fixture.status} • ${fixture.season?.name || "Season"} • ${fixture.scheduledDate.toLocaleDateString()}`,
          status: fixture.status,
          date: fixture.scheduledDate.toLocaleDateString(),
          url: `/admin/entity/${fixture.id}`,
          matchScore: this.calculateMatchScore(fixture.id, query, `${homeName} ${awayName}`, searchType),
          metadata: {
            seasonId: fixture.seasonId,
            homePlayerId: fixture.homePlayerId,
            awayPlayerId: fixture.awayPlayerId,
            homeScore: fixture.homeScore,
            awayScore: fixture.awayScore,
            scheduledDate: fixture.scheduledDate,
            status: fixture.status,
            homeName,
            awayName,
          },
        }
      })
    } catch {
      return []
    }
  }

  /**
   * ✅ Search Results
   */
  private async searchResults(query: string, searchType: string): Promise<SearchResult[]> {
    try {
      const results = await prisma.result.findMany({
        where: {
          OR: [
            { id: { contains: query } },
            { fixture: { homePlayer: { name: { contains: query } } } },
            { fixture: { awayPlayer: { name: { contains: query } } } },
          ],
        },
        include: {
          fixture: {
            include: {
              homePlayer: { include: { profile: true } },
              awayPlayer: { include: { profile: true } },
            },
          },
        },
        take: 10,
      })

      return results.map((result) => {
        const homeName = result.fixture?.homePlayer?.profile?.username || result.fixture?.homePlayer?.name || "Home"
        const awayName = result.fixture?.awayPlayer?.profile?.username || result.fixture?.awayPlayer?.name || "Away"
        
        return {
          type: "result",
          id: result.id,
          title: `${homeName} ${result.homeScore} - ${result.awayScore} ${awayName}`,
          subtitle: `${result.approved ? "Approved" : "Pending"} • ${result.createdAt.toLocaleDateString()}`,
          status: result.approved ? "Approved" : "Pending",
          date: result.createdAt.toLocaleDateString(),
          url: `/admin/entity/${result.id}`,
          matchScore: this.calculateMatchScore(result.id, query, `${homeName} ${awayName}`, searchType),
          metadata: {
            fixtureId: result.fixtureId,
            homeScore: result.homeScore,
            awayScore: result.awayScore,
            approved: result.approved,
            submittedBy: result.submittedBy,
            createdAt: result.createdAt,
          },
        }
      })
    } catch {
      return []
    }
  }

  /**
   * ✅ Search Payments
   */
  private async searchPayments(query: string, searchType: string): Promise<SearchResult[]> {
    try {
      const payments = await prisma.paymentAudit.findMany({
        where: {
          OR: [
            { id: { contains: query } },
            { notes: { contains: query } },
            { user: { name: { contains: query } } },
          ],
        },
        include: {
          user: { include: { profile: true } },
        },
        take: 10,
      })

      return payments.map((payment) => ({
        type: "payment",
        id: payment.id,
        title: `Payment from ${payment.user?.profile?.username || payment.user?.name || "Unknown"}`,
        subtitle: `${payment.action} • ${payment.createdAt.toLocaleDateString()}`,
        status: payment.action,
        date: payment.createdAt.toLocaleDateString(),
        url: `/admin/entity/${payment.id}`,
        matchScore: this.calculateMatchScore(payment.id, query, payment.user?.name || "", searchType),
        metadata: {
          userId: payment.userId,
          action: payment.action,
          notes: payment.notes,
          createdAt: payment.createdAt,
          seasonEntryId: payment.seasonEntryId,
        },
      }))
    } catch {
      return []
    }
  }

  /**
   * ✅ Search Squads
   */
  private async searchSquads(query: string, searchType: string): Promise<SearchResult[]> {
    try {
      const squads = await prisma.squad.findMany({
        where: {
          OR: [
            { id: { contains: query } },
            { user: { name: { contains: query } } },
            { formation: { contains: query } },
          ],
        },
        include: {
          user: { include: { profile: true } },
        },
        take: 5,
      })

      return squads.map((squad) => ({
        type: "squad",
        id: squad.id,
        title: `${squad.user?.profile?.username || squad.user?.name || "Unknown"}'s Squad`,
        subtitle: `${squad.type} • ${squad.formation} • ${squad.teamStrength} Strength`,
        status: squad.isActive ? "Active" : "Inactive",
        date: squad.createdAt.toLocaleDateString(),
        url: `/admin/entity/${squad.id}`,
        matchScore: this.calculateMatchScore(squad.id, query, squad.user?.name || "", searchType),
        metadata: {
          userId: squad.userId,
          type: squad.type,
          formation: squad.formation,
          teamStrength: squad.teamStrength,
          playstyle: squad.playstyle,
          isActive: squad.isActive,
          screenshot: squad.screenshot,
        },
      }))
    } catch {
      return []
    }
  }

  /**
   * ✅ Search News
   */
  private async searchNews(query: string, searchType: string): Promise<SearchResult[]> {
    try {
      const news = await prisma.news.findMany({
        where: {
          OR: [
            { id: { contains: query } },
            { title: { contains: query } },
            { content: { contains: query } },
            { author: { name: { contains: query } } },
          ],
        },
        include: {
          author: { include: { profile: true } },
        },
        take: 5,
      })

      return news.map((item) => ({
        type: "news",
        id: item.id,
        title: item.title,
        subtitle: `${item.published ? "Published" : "Draft"} • ${item.author?.name || "Unknown"} • ${item.createdAt.toLocaleDateString()}`,
        status: item.published ? "Published" : "Draft",
        date: item.createdAt.toLocaleDateString(),
        url: `/admin/entity/${item.id}`,
        matchScore: this.calculateMatchScore(item.id, query, item.title, searchType),
        metadata: {
          authorId: item.authorId,
          content: item.content.substring(0, 200),
          published: item.published,
          publishedAt: item.publishedAt,
          createdAt: item.createdAt,
        },
      }))
    } catch {
      return []
    }
  }

  /**
   * ✅ Search Awards
   */
  private async searchAwards(query: string, searchType: string): Promise<SearchResult[]> {
    try {
      const awards = await prisma.award.findMany({
        where: {
          OR: [
            { id: { contains: query } },
            { name: { contains: query } },
            { winner: { name: { contains: query } } },
          ],
        },
        include: {
          winner: { include: { profile: true } },
          season: true,
        },
        take: 5,
      })

      return awards.map((award) => ({
        type: "award",
        id: award.id,
        title: award.name,
        subtitle: `${award.winner?.profile?.username || award.winner?.name || "Unknown"} • ${award.season?.name || "Season"}`,
        status: award.category,
        date: award.awardedAt.toLocaleDateString(),
        url: `/admin/entity/${award.id}`,
        matchScore: this.calculateMatchScore(award.id, query, award.name, searchType),
        metadata: {
          seasonId: award.seasonId,
          winnerId: award.winnerId,
          category: award.category,
          icon: award.icon,
          description: award.description,
          awardedAt: award.awardedAt,
          isAutoGenerated: award.isAutoGenerated,
        },
      }))
    } catch {
      return []
    }
  }

  /**
   * ✅ Search Hall of Fame
   */
  private async searchHallOfFame(query: string, searchType: string): Promise<SearchResult[]> {
    try {
      const entries = await prisma.hallOfFame.findMany({
        where: {
          OR: [
            { id: { contains: query } },
            { player: { name: { contains: query } } },
            { category: { contains: query } },
          ],
        },
        include: {
          player: { include: { profile: true } },
          season: true,
        },
        take: 5,
      })

      return entries.map((entry) => ({
        type: "hallOfFame",
        id: entry.id,
        title: `${entry.player?.profile?.username || entry.player?.name || "Unknown"}`,
        subtitle: `${entry.category} • ${entry.season?.name || "Season"}`,
        status: entry.category,
        date: entry.inductedAt.toLocaleDateString(),
        url: `/admin/entity/${entry.id}`,
        matchScore: this.calculateMatchScore(entry.id, query, entry.player?.name || "", searchType),
        metadata: {
          playerId: entry.playerId,
          seasonId: entry.seasonId,
          category: entry.category,
          reason: entry.reason,
          imageUrl: entry.imageUrl,
          inductedAt: entry.inductedAt,
        },
      }))
    } catch {
      return []
    }
  }

  /**
   * ✅ Calculate match score for sorting results by relevance
   */
  private calculateMatchScore(id: string, query: string, name: string, searchType: string): number {
    let score = 0
    const lowerQuery = query.toLowerCase()
    const lowerName = name.toLowerCase()
    const lowerId = id.toLowerCase()

    // ✅ Exact ID match (highest priority)
    if (lowerId === lowerQuery) score += 100

    // ✅ ID contains query
    if (lowerId.includes(lowerQuery)) score += 50

    // ✅ Exact name match
    if (lowerName === lowerQuery) score += 80

    // ✅ Name starts with query
    if (lowerName.startsWith(lowerQuery)) score += 60

    // ✅ Name contains query
    if (lowerName.includes(lowerQuery)) score += 30

    // ✅ ID search boost
    if (searchType === "id") score += 20

    // ✅ Word match boost
    const queryWords = lowerQuery.split(/\s+/)
    for (const word of queryWords) {
      if (lowerName.includes(word)) score += 10
    }

    return score
  }
}

// ✅ THIS EXPORT IS REQUIRED - DO NOT REMOVE
export const searchService = new SearchService()