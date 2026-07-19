import { prisma } from "@/lib/prisma"

export async function clearAllData() {
  try {
    console.log("🧹 Starting data cleanup...")

    await prisma.$transaction(async (tx) => {
      // Delete in reverse order to avoid foreign key conflicts

      // 1. Delete payment audits
      await tx.paymentAudit.deleteMany()
      console.log("✅ Payment audits cleared")

      // 2. Delete notifications
      await tx.notification.deleteMany()
      console.log("✅ Notifications cleared")

      // 3. Delete results
      await tx.result.deleteMany()
      console.log("✅ Results cleared")

      // 4. Delete fixtures
      await tx.fixture.deleteMany()
      console.log("✅ Fixtures cleared")

      // 5. Delete league entries
      await tx.leagueEntry.deleteMany()
      console.log("✅ League entries cleared")

      // 6. Delete season entries
      await tx.seasonEntry.deleteMany()
      console.log("✅ Season entries cleared")

      // 7. Delete prize pools
      await tx.prizePool.deleteMany()
      console.log("✅ Prize pools cleared")

      // 8. Delete tournament participants
      await tx.tournamentParticipant.deleteMany()
      console.log("✅ Tournament participants cleared")

      // 9. Delete tournament matches
      await tx.tournamentMatch.deleteMany()
      console.log("✅ Tournament matches cleared")

      // 10. Delete tournaments
      await tx.tournament.deleteMany()
      console.log("✅ Tournaments cleared")

      // 11. Delete awards
      await tx.award.deleteMany()
      console.log("✅ Awards cleared")

      // 12. Delete hall of fame
      await tx.hallOfFame.deleteMany()
      console.log("✅ Hall of Fame cleared")

      // 13. Delete news
      await tx.news.deleteMany()
      console.log("✅ News cleared")

      // 14. Delete posts, comments, likes
      await tx.like.deleteMany()
      await tx.comment.deleteMany()
      await tx.post.deleteMany()
      console.log("✅ Community content cleared")

      // 15. Delete reports
      await tx.report.deleteMany()
      console.log("✅ Reports cleared")

      // 16. Keep seasons, users, profiles, and settings
      console.log("✅ Keeping: Seasons, Users, Profiles, Settings")

      console.log("🎉 Data cleanup completed successfully!")
    })

    return { success: true, message: "Data cleared successfully" }
  } catch (error) {
    console.error("Error clearing data:", error)
    throw new Error("Failed to clear data")
  }
}