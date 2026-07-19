import { prisma } from "@/lib/prisma"

export async function updateLastActive(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastActive: new Date() }
  })
}