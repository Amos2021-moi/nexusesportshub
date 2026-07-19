import { prisma } from "./prisma"

export async function logAuditEvent(
  userId: string,
  action: string,
  targetType: string,
  targetId?: string,
  details?: any,
  request?: Request
) {
  let ipAddress: string | undefined
  let userAgent: string | undefined

  if (request) {
    ipAddress = request.headers.get("x-forwarded-for") || 
                 request.headers.get("x-real-ip") || 
                 "unknown"
    userAgent = request.headers.get("user-agent") || "unknown"
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action,
      targetType,
      targetId,
      details: details || {},
      ipAddress,
      userAgent
    }
  })
}