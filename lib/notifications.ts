import { prisma } from "@/lib/prisma"

export async function createNotification({
  userId,
  title,
  message,
  type,
  link,
}: {
  userId: string
  title: string
  message: string
  type: string
  link?: string
}) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link: link || null,
      },
    })
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

export async function notifyMatchResultApproved({
  homePlayerId,
  awayPlayerId,
  match,
  score,
}: {
  homePlayerId: string
  awayPlayerId: string
  match: any
  score: string
}) {
  const homeName = match.homePlayer?.profile?.username || match.homePlayer?.name || "Home"
  const awayName = match.awayPlayer?.profile?.username || match.awayPlayer?.name || "Away"

  await Promise.all([
    createNotification({
      userId: homePlayerId,
      title: "✅ Match Result Approved",
      message: `Your match vs ${awayName} (${score}) has been approved!`,
      type: "RESULT_APPROVED",
      link: `/matches/${match.id}`,
    }),
    createNotification({
      userId: awayPlayerId,
      title: "✅ Match Result Approved",
      message: `Your match vs ${homeName} (${score}) has been approved!`,
      type: "RESULT_APPROVED",
      link: `/matches/${match.id}`,
    }),
  ])
}

export async function notifyTournamentMatchResult({
  winnerId,
  loserId,
  match,
}: {
  winnerId: string
  loserId: string
  match: any
}) {
  // ✅ FIXED: Use match.winner.name directly instead of .profile.username
  const winnerName = match.winner?.name || "Player"

  await Promise.all([
    createNotification({
      userId: winnerId,
      title: "🏆 Tournament Match Won!",
      message: `You won your ${match.tournament.name} match! ${winnerName} advances to the next round.`,
      type: "AWARD_EARNED",
      link: `/tournaments/${match.tournamentId}`,
    }),
    createNotification({
      userId: loserId,
      title: "❌ Tournament Match Lost",
      message: `You lost your ${match.tournament.name} match. Better luck next time!`,
      type: "RESULT_APPROVED",
      link: `/tournaments/${match.tournamentId}`,
    }),
  ])
}

export async function notifyNewFixture({
  playerId,
  opponentName,
  fixtureId,
}: {
  playerId: string
  opponentName: string
  fixtureId: string
}) {
  await createNotification({
    userId: playerId,
    title: "📅 New Fixture Assigned",
    message: `You have a new match vs ${opponentName}. Check your fixtures!`,
    type: "NEW_FIXTURE",
    link: `/dashboard/fixtures`,
  })
}

export async function notifyTournamentStart({
  playerId,
  tournamentName,
  tournamentId,
}: {
  playerId: string
  tournamentName: string
  tournamentId: string
}) {
  await createNotification({
    userId: playerId,
    title: "🏟️ Tournament Started!",
    message: `${tournamentName} has started! Check your bracket.`,
    type: "NEW_FIXTURE",
    link: `/tournaments/${tournamentId}`,
  })
}