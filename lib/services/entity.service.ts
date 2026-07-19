import { prisma } from "@/lib/prisma"
import { CompetitionStatus } from "@prisma/client"

export class EntityService {
  async getEntityById(id: string): Promise<any | null> {
    // ✅ Detect type from ID pattern
    const type = this.detectEntityType(id)

    switch (type) {
      case "season":
        return this.getSeason(id)
      case "tournament":
        return this.getTournament(id)
      case "player":
        return this.getPlayer(id)
      case "fixture":
        return this.getFixture(id)
      case "result":
        return this.getResult(id)
      case "payment":
        return this.getPayment(id)
      case "squad":
        return this.getSquad(id)
      case "news":
        return this.getNews(id)
      case "award":
        return this.getAward(id)
      case "hallOfFame":
        return this.getHallOfFame(id)
      default:
        // ✅ Try to find by exact ID match across all tables
        return this.findByIdAcrossTables(id)
    }
  }

  private detectEntityType(id: string): string | null {
    const patterns: Record<string, RegExp> = {
      season: /^season_|^SEA-|^[a-f0-9]{24}$/i,
      tournament: /^tournament_|^TOR-|^[a-f0-9]{24}$/i,
      player: /^player_|^PLY-|^[a-f0-9]{24}$/i,
      fixture: /^fixture_|^FIX-|^[a-f0-9]{24}$/i,
      result: /^result_|^RES-|^[a-f0-9]{24}$/i,
      payment: /^payment_|^PAY-|^[a-f0-9]{24}$/i,
      squad: /^squad_|^SQU-|^[a-f0-9]{24}$/i,
      news: /^news_|^NEW-|^[a-f0-9]{24}$/i,
      award: /^award_|^AWD-|^[a-f0-9]{24}$/i,
      hallOfFame: /^hof_|^HOF-|^[a-f0-9]{24}$/i,
    }

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(id)) {
        return type
      }
    }

    return null
  }

  private async findByIdAcrossTables(id: string): Promise<any | null> {
    // ✅ Try each table
    const tables = [
      { type: "season", fn: () => prisma.season.findUnique({ where: { id } }) },
      { type: "tournament", fn: () => prisma.tournament.findUnique({ where: { id } }) },
      { type: "user", fn: () => prisma.user.findUnique({ where: { id } }) },
      { type: "fixture", fn: () => prisma.fixture.findUnique({ where: { id } }) },
      { type: "result", fn: () => prisma.result.findUnique({ where: { id } }) },
      { type: "paymentAudit", fn: () => prisma.paymentAudit.findUnique({ where: { id } }) },
      { type: "squad", fn: () => prisma.squad.findUnique({ where: { id } }) },
      { type: "news", fn: () => prisma.news.findUnique({ where: { id } }) },
      { type: "award", fn: () => prisma.award.findUnique({ where: { id } }) },
      { type: "hallOfFame", fn: () => prisma.hallOfFame.findUnique({ where: { id } }) },
    ]

    for (const table of tables) {
      const result = await table.fn()
      if (result) {
        // ✅ Convert to entity format
        return this.formatEntity(table.type as any, result)
      }
    }

    return null
  }

  private formatEntity(type: string, data: any): any {
    // ✅ Generic formatter for fallback entities
    return {
      type,
      id: data.id,
      title: data.name || data.title || data.id,
      data: data,
      metadata: {
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        status: data.status,
      },
      schema: {},
      related: {},
    }
  }

  private async getSeason(id: string) {
    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        leagueEntries: {
          include: { player: { include: { profile: true } } },
          take: 10,
        },
        fixtures: {
          take: 10,
        },
        tournaments: true,
        awards: true,
        prizePool: true,
        leagueSettings: true,
      },
    })

    if (!season) return null

    return {
      type: "season",
      id: season.id,
      title: season.name,
      data: {
        name: season.name,
        description: season.description || "No description",
        status: season.status,
        isActive: season.isActive,
        startDate: season.startDate.toLocaleDateString(),
        endDate: season.endDate.toLocaleDateString(),
        players: season.leagueEntries.length,
        fixtures: season.fixtures.length,
        tournaments: season.tournaments.length,
        awards: season.awards.length,
        prizePool: season.prizePool?.totalCollected || 0,
        entryFee: season.leagueSettings?.entryFee || 0,
        paymentRequired: season.leagueSettings?.paymentRequired || false,
      },
      metadata: {
        status: season.status,
        isActive: season.isActive,
        startDate: season.startDate,
        endDate: season.endDate,
        createdAt: season.createdAt,
        updatedAt: season.updatedAt,
      },
      schema: {
        name: { label: "Season Name", type: "text" },
        description: { label: "Description", type: "textarea", rows: 3 },
        status: {
          label: "Status",
          type: "select",
          options: ["PRESEASON", "REGISTRATION", "FIXTURE_LOCK", "LIVE", "ENDED", "ARCHIVED"],
        },
        isActive: { label: "Active", type: "checkbox" },
        entryFee: { label: "Entry Fee (KES)", type: "number" },
        paymentRequired: { label: "Payment Required", type: "checkbox" },
      },
      related: {
        players: season.leagueEntries.map(e => ({
          id: e.playerId,
          name: e.player.profile?.username || e.player.name,
        })),
        fixtures: season.fixtures.map(f => ({
          id: f.id,
          title: `Match ${f.id.slice(0, 6)}`,
        })),
        tournaments: season.tournaments.map(t => ({
          id: t.id,
          name: t.name,
        })),
        awards: season.awards.map(a => ({
          id: a.id,
          name: a.name,
        })),
      },
    }
  }

  private async getTournament(id: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: {
          include: { player: { include: { profile: true } } },
        },
        matches: {
          include: {
            homePlayer: { include: { profile: true } },
            awayPlayer: { include: { profile: true } },
            winner: { include: { profile: true } },
          },
        },
        season: true,
      },
    })

    if (!tournament) return null

    return {
      type: "tournament",
      id: tournament.id,
      title: tournament.name,
      data: {
        name: tournament.name,
        description: tournament.description || "No description",
        type: tournament.type,
        status: tournament.status,
        startDate: tournament.startDate.toLocaleDateString(),
        endDate: tournament.endDate.toLocaleDateString(),
        maxPlayers: tournament.maxPlayers,
        participants: tournament.participants.length,
        matches: tournament.matches.length,
        season: tournament.season?.name,
      },
      metadata: {
        status: tournament.status,
        type: tournament.type,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        createdAt: tournament.createdAt,
        updatedAt: tournament.updatedAt,
        seasonId: tournament.seasonId,
      },
      schema: {
        name: { label: "Tournament Name", type: "text" },
        description: { label: "Description", type: "textarea", rows: 3 },
        type: {
          label: "Type",
          type: "select",
          options: ["SINGLE_ELIM", "DOUBLE_ELIM"],
        },
        status: {
          label: "Status",
          type: "select",
          options: ["PENDING", "ACTIVE", "COMPLETED"],
        },
        maxPlayers: { label: "Max Players", type: "number" },
      },
      related: {
        participants: tournament.participants.map(p => ({
          id: p.playerId,
          name: p.player.profile?.username || p.player.name,
        })),
        matches: tournament.matches.map(m => ({
          id: m.id,
          title: `Round ${m.round} - Match ${m.matchNumber}`,
        })),
        season: tournament.season ? [{
          id: tournament.season.id,
          name: tournament.season.name,
        }] : [],
      },
    }
  }

  private async getPlayer(id: string) {
    const player = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        leagueEntries: {
          include: { season: true },
          take: 5,
        },
        squads: true,
        awards: {
          include: { season: true },
        },
        homeFixtures: {
          include: { awayPlayer: { include: { profile: true } } },
          take: 5,
        },
        awayFixtures: {
          include: { homePlayer: { include: { profile: true } } },
          take: 5,
        },
      },
    })

    if (!player) return null

    return {
      type: "player",
      id: player.id,
      title: player.profile?.username || player.name || "Unknown",
      data: {
        name: player.name,
        email: player.email,
        username: player.profile?.username || "N/A",
        role: player.role,
        isVerified: player.isVerified,
        trustScore: player.profile?.trustScore || 0,
        totalPoints: player.profile?.totalPoints || 0,
        totalWins: player.profile?.totalWins || 0,
        totalDraws: player.profile?.totalDraws || 0,
        totalLosses: player.profile?.totalLosses || 0,
        goalsFor: player.profile?.goalsFor || 0,
        goalsAgainst: player.profile?.goalsAgainst || 0,
        goalDifference: (player.profile?.goalsFor || 0) - (player.profile?.goalsAgainst || 0),
        whatsapp: player.profile?.whatsappNumber || "Not set",
        class: player.profile?.class || "Not set",
        favoriteClub: player.profile?.favoriteClub || "Not set",
        preferredFormation: player.profile?.preferredFormation || "Not set",
        preferredPlaystyle: player.profile?.preferredPlaystyle || "Not set",
        bio: player.profile?.bio || "No bio",
        awards: player.awards.length,
        squads: player.squads.length,
      },
      metadata: {
        role: player.role,
        isVerified: player.isVerified,
        trustScore: player.profile?.trustScore || 0,
        createdAt: player.createdAt,
        lastActive: player.lastActive,
        emailVerified: player.emailVerified,
        verifiedBadge: player.profile?.verifiedBadge || false,
      },
      schema: {
        name: { label: "Full Name", type: "text" },
        username: { label: "Username", type: "text" },
        email: { label: "Email", type: "text" },
        class: { label: "Class", type: "text" },
        favoriteClub: { label: "Favorite Club", type: "text" },
        preferredFormation: { label: "Preferred Formation", type: "text" },
        preferredPlaystyle: { label: "Preferred Playstyle", type: "text" },
        bio: { label: "Bio", type: "textarea", rows: 3 },
        isVerified: { label: "Verified", type: "checkbox" },
        whatsappNumber: { label: "WhatsApp Number", type: "text" },
      },
      related: {
        seasons: player.leagueEntries.map(e => ({
          id: e.season.id,
          name: e.season.name,
        })),
        squads: player.squads.map(s => ({
          id: s.id,
          title: `${s.type} - ${s.formation}`,
        })),
        awards: player.awards.map(a => ({
          id: a.id,
          name: a.name,
        })),
        fixtures: [
          ...player.homeFixtures.map(f => ({
            id: f.id,
            title: `vs ${f.awayPlayer?.profile?.username || "Unknown"}`,
          })),
          ...player.awayFixtures.map(f => ({
            id: f.id,
            title: `vs ${f.homePlayer?.profile?.username || "Unknown"}`,
          })),
        ],
      },
    }
  }

  private async getFixture(id: string) {
    const fixture = await prisma.fixture.findUnique({
      where: { id },
      include: {
        homePlayer: { include: { profile: true } },
        awayPlayer: { include: { profile: true } },
        season: true,
        result: {
          include: { user: { include: { profile: true } } },
        },
      },
    })

    if (!fixture) return null

    return {
      type: "fixture",
      id: fixture.id,
      title: `${fixture.homePlayer?.profile?.username || "Home"} vs ${fixture.awayPlayer?.profile?.username || "Away"}`,
      data: {
        status: fixture.status,
        scheduledDate: fixture.scheduledDate.toLocaleString(),
        homePlayer: fixture.homePlayer?.profile?.username || fixture.homePlayer?.name || "Unknown",
        awayPlayer: fixture.awayPlayer?.profile?.username || fixture.awayPlayer?.name || "Unknown",
        homeScore: fixture.homeScore ?? "Pending",
        awayScore: fixture.awayScore ?? "Pending",
        season: fixture.season?.name,
        hasResult: !!fixture.result,
        resultApproved: fixture.result?.approved || false,
        resultSubmittedBy: fixture.result?.user?.profile?.username || "Unknown",
        submittedAt: fixture.result?.createdAt?.toLocaleString() || "Not submitted",
      },
      metadata: {
        status: fixture.status,
        scheduledDate: fixture.scheduledDate,
        seasonId: fixture.seasonId,
        homePlayerId: fixture.homePlayerId,
        awayPlayerId: fixture.awayPlayerId,
        resultId: fixture.result?.id,
        createdAt: fixture.createdAt,
        updatedAt: fixture.updatedAt,
      },
      schema: {
        status: {
          label: "Status",
          type: "select",
          options: ["SCHEDULED", "PENDING", "COMPLETED"],
        },
        scheduledDate: { label: "Scheduled Date", type: "datetime-local" },
        homeScore: { label: "Home Score", type: "number" },
        awayScore: { label: "Away Score", type: "number" },
      },
      related: {
        homePlayer: fixture.homePlayer ? [{
          id: fixture.homePlayerId!,
          name: fixture.homePlayer.profile?.username || fixture.homePlayer.name,
        }] : [],
        awayPlayer: fixture.awayPlayer ? [{
          id: fixture.awayPlayerId!,
          name: fixture.awayPlayer.profile?.username || fixture.awayPlayer.name,
        }] : [],
        season: fixture.season ? [{
          id: fixture.season.id,
          name: fixture.season.name,
        }] : [],
        result: fixture.result ? [{
          id: fixture.result.id,
          title: `${fixture.homeScore} - ${fixture.awayScore}`,
        }] : [],
      },
    }
  }

  private async getResult(id: string) {
    const result = await prisma.result.findUnique({
      where: { id },
      include: {
        fixture: {
          include: {
            homePlayer: { include: { profile: true } },
            awayPlayer: { include: { profile: true } },
          },
        },
        user: { include: { profile: true } },
        tournamentMatch: {
          include: {
            tournament: true,
          },
        },
      },
    })

    if (!result) return null

    return {
      type: "result",
      id: result.id,
      title: `${result.fixture?.homePlayer?.profile?.username || "Home"} ${result.homeScore} - ${result.awayScore} ${result.fixture?.awayPlayer?.profile?.username || "Away"}`,
      data: {
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        approved: result.approved,
        source: result.source,
        submittedBy: result.user?.profile?.username || result.user?.name || "Unknown",
        submittedAt: result.createdAt.toLocaleString(),
        fixtureId: result.fixtureId,
        hasEvidence: !!result.evidenceImage,
      },
      metadata: {
        approved: result.approved,
        source: result.source,
        submittedBy: result.submittedBy,
        createdAt: result.createdAt,
        fixtureId: result.fixtureId,
        tournamentMatchId: result.tournamentMatchId,
      },
      schema: {
        homeScore: { label: "Home Score", type: "number" },
        awayScore: { label: "Away Score", type: "number" },
        approved: { label: "Approved", type: "checkbox" },
      },
      related: {
        fixture: result.fixture ? [{
          id: result.fixture.id,
          title: `${result.fixture.homePlayer?.profile?.username || "Home"} vs ${result.fixture.awayPlayer?.profile?.username || "Away"}`,
        }] : [],
        submittedBy: result.user ? [{
          id: result.user.id,
          name: result.user.profile?.username || result.user.name,
        }] : [],
      },
    }
  }

  private async getPayment(id: string) {
    const payment = await prisma.paymentAudit.findUnique({
      where: { id },
      include: {
        user: { include: { profile: true } },
        seasonEntry: {
          include: { season: true },
        },
      },
    })

    if (!payment) return null

    return {
      type: "payment",
      id: payment.id,
      title: `Payment by ${payment.user?.profile?.username || payment.user?.name || "Unknown"}`,
      data: {
        action: payment.action,
        notes: payment.notes || "No notes",
        user: payment.user?.profile?.username || payment.user?.name || "Unknown",
        season: payment.seasonEntry?.season?.name || "Unknown",
        amount: payment.seasonEntry?.entryFee || 0,
        phone: payment.seasonEntry?.phoneNumber || "Not provided",
        receipt: payment.seasonEntry?.mpesaReceipt || "N/A",
        createdAt: payment.createdAt.toLocaleString(),
      },
      metadata: {
        action: payment.action,
        userId: payment.userId,
        seasonEntryId: payment.seasonEntryId,
        createdAt: payment.createdAt,
      },
      schema: {
        notes: { label: "Notes", type: "textarea", rows: 3 },
      },
      related: {
        user: payment.user ? [{
          id: payment.user.id,
          name: payment.user.profile?.username || payment.user.name,
        }] : [],
        season: payment.seasonEntry?.season ? [{
          id: payment.seasonEntry.season.id,
          name: payment.seasonEntry.season.name,
        }] : [],
      },
    }
  }

  private async getSquad(id: string) {
    const squad = await prisma.squad.findUnique({
      where: { id },
      include: {
        user: { include: { profile: true } },
      },
    })

    if (!squad) return null

    return {
      type: "squad",
      id: squad.id,
      title: `${squad.user?.profile?.username || "Unknown"}'s Squad`,
      data: {
        type: squad.type,
        formation: squad.formation,
        teamStrength: squad.teamStrength,
        playstyle: squad.playstyle || "Not specified",
        description: squad.description || "No description",
        isActive: squad.isActive,
        status: squad.status,
        createdAt: squad.createdAt.toLocaleString(),
        updatedAt: squad.updatedAt.toLocaleString(),
        player: squad.user?.profile?.username || squad.user?.name || "Unknown",
        screenshot: squad.screenshot ? "✅ Uploaded" : "❌ Not uploaded",
      },
      metadata: {
        type: squad.type,
        isActive: squad.isActive,
        status: squad.status,
        userId: squad.userId,
        createdAt: squad.createdAt,
        updatedAt: squad.updatedAt,
      },
      schema: {
        type: {
          label: "Type",
          type: "select",
          options: ["MAIN", "SEASONAL", "TOURNAMENT"],
        },
        formation: { label: "Formation", type: "text" },
        teamStrength: { label: "Team Strength", type: "number" },
        playstyle: { label: "Playstyle", type: "text" },
        description: { label: "Description", type: "textarea", rows: 3 },
        isActive: { label: "Active", type: "checkbox" },
        status: {
          label: "Status",
          type: "select",
          options: ["PENDING", "APPROVED", "REJECTED"],
        },
      },
      related: {
        player: squad.user ? [{
          id: squad.user.id,
          name: squad.user.profile?.username || squad.user.name,
        }] : [],
      },
    }
  }

  private async getNews(id: string) {
    const news = await prisma.news.findUnique({
      where: { id },
      include: {
        author: { include: { profile: true } },
      },
    })

    if (!news) return null

    return {
      type: "news",
      id: news.id,
      title: news.title,
      data: {
        title: news.title,
        content: news.content,
        author: news.author?.profile?.username || news.author?.name || "Unknown",
        published: news.published,
        publishedAt: news.publishedAt?.toLocaleString() || "Not published",
        createdAt: news.createdAt.toLocaleString(),
        updatedAt: news.updatedAt.toLocaleString(),
        hasImage: !!news.image,
      },
      metadata: {
        published: news.published,
        authorId: news.authorId,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
        publishedAt: news.publishedAt,
      },
      schema: {
        title: { label: "Title", type: "text" },
        content: { label: "Content", type: "textarea", rows: 6 },
        published: { label: "Published", type: "checkbox" },
      },
      related: {
        author: news.author ? [{
          id: news.author.id,
          name: news.author.profile?.username || news.author.name,
        }] : [],
      },
    }
  }

  private async getAward(id: string) {
    const award = await prisma.award.findUnique({
      where: { id },
      include: {
        winner: { include: { profile: true } },
        season: true,
      },
    })

    if (!award) return null

    return {
      type: "award",
      id: award.id,
      title: award.name,
      data: {
        name: award.name,
        category: award.category,
        description: award.description || "No description",
        winner: award.winner?.profile?.username || award.winner?.name || "Unknown",
        season: award.season?.name || "Unknown",
        icon: award.icon || "Award",
        isAutoGenerated: award.isAutoGenerated,
        awardedAt: award.awardedAt.toLocaleString(),
      },
      metadata: {
        category: award.category,
        isAutoGenerated: award.isAutoGenerated,
        seasonId: award.seasonId,
        winnerId: award.winnerId,
        awardedAt: award.awardedAt,
      },
      schema: {
        name: { label: "Award Name", type: "text" },
        description: { label: "Description", type: "textarea", rows: 3 },
        category: { label: "Category", type: "text" },
        icon: { label: "Icon", type: "text" },
      },
      related: {
        winner: award.winner ? [{
          id: award.winner.id,
          name: award.winner.profile?.username || award.winner.name,
        }] : [],
        season: award.season ? [{
          id: award.season.id,
          name: award.season.name,
        }] : [],
      },
    }
  }

  private async getHallOfFame(id: string) {
    const entry = await prisma.hallOfFame.findUnique({
      where: { id },
      include: {
        player: { include: { profile: true } },
        season: true,
      },
    })

    if (!entry) return null

    return {
      type: "hallOfFame",
      id: entry.id,
      title: `${entry.player?.profile?.username || "Unknown"} - ${entry.category}`,
      data: {
        player: entry.player?.profile?.username || entry.player?.name || "Unknown",
        category: entry.category,
        reason: entry.reason,
        season: entry.season?.name || "Unknown",
        hasImage: !!entry.imageUrl,
        inductedAt: entry.inductedAt.toLocaleString(),
      },
      metadata: {
        category: entry.category,
        playerId: entry.playerId,
        seasonId: entry.seasonId,
        inductedAt: entry.inductedAt,
      },
      schema: {
        reason: { label: "Reason", type: "textarea", rows: 3 },
        category: { label: "Category", type: "text" },
      },
      related: {
        player: entry.player ? [{
          id: entry.player.id,
          name: entry.player.profile?.username || entry.player.name,
        }] : [],
        season: entry.season ? [{
          id: entry.season.id,
          name: entry.season.name,
        }] : [],
      },
    }
  }
}

export const entityService = new EntityService()