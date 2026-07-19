import { prisma } from "@/lib/prisma"
import { CompetitionStatus } from "@prisma/client"

export class CompetitionService {
  // ✅ Get player's competition status for a season
  async getPlayerStatus(userId: string, seasonId: string) {
    try {
      const entry = await prisma.seasonEntry.findUnique({
        where: {
          userId_seasonId: {
            userId,
            seasonId,
          },
        },
      })

      return entry?.status || CompetitionStatus.NOT_ENROLLED
    } catch (error) {
      console.error("Error getting competition status:", error)
      return CompetitionStatus.NOT_ENROLLED
    }
  }

  // ✅ Get player's full entry
  async getPlayerEntry(userId: string, seasonId: string) {
    try {
      return await prisma.seasonEntry.findUnique({
        where: {
          userId_seasonId: {
            userId,
            seasonId,
          },
        },
      })
    } catch (error) {
      console.error("Error getting player entry:", error)
      return null
    }
  }

  // ✅ Get all active players for a season
  async getActivePlayers(seasonId: string) {
    try {
      const entries = await prisma.seasonEntry.findMany({
        where: {
          seasonId,
          status: CompetitionStatus.ACTIVE,
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      })

      return entries.map(entry => entry.user)
    } catch (error) {
      console.error("Error getting active players:", error)
      return []
    }
  }

  // ✅ Check if player is active
  async isPlayerActive(userId: string, seasonId: string): Promise<boolean> {
    const status = await this.getPlayerStatus(userId, seasonId)
    return status === CompetitionStatus.ACTIVE
  }

  // ✅ Get competition stats for admin
  async getCompetitionStats(seasonId: string) {
    try {
      const [total, active, pending, refunded] = await Promise.all([
        prisma.seasonEntry.count({ where: { seasonId } }),
        prisma.seasonEntry.count({
          where: { seasonId, status: CompetitionStatus.ACTIVE },
        }),
        prisma.seasonEntry.count({
          where: { seasonId, status: CompetitionStatus.PAYMENT_PENDING },
        }),
        prisma.seasonEntry.count({
          where: { seasonId, status: CompetitionStatus.REFUNDED },
        }),
      ])

      const prizePool = await prisma.prizePool.findUnique({
        where: { seasonId },
      })

      return {
        total,
        active,
        pending,
        refunded,
        prizePool: prizePool?.totalCollected || 0,
        entryFee: prizePool?.entryFee || 0,
      }
    } catch (error) {
      console.error("Error getting competition stats:", error)
      return {
        total: 0,
        active: 0,
        pending: 0,
        refunded: 0,
        prizePool: 0,
        entryFee: 0,
      }
    }
  }

  // ✅ Get all entries for admin
  async getEntries(seasonId: string) {
    try {
      return await prisma.seasonEntry.findMany({
        where: { seasonId },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      console.error("Error getting entries:", error)
      return []
    }
  }
}

export const competitionService = new CompetitionService()