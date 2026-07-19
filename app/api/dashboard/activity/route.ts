// app/api/dashboard/activity/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const startTime = performance.now();

    // ✅ Use multiple queries instead of UNION (simpler and more reliable)
    const [results, fixtures, notifications] = await Promise.all([
      // Results
      prisma.$queryRaw<Activity[]>`
        SELECT 
          r.id,
          'RESULT' as type,
          CASE 
            WHEN r.approved = true THEN '🎉 Match Won!'
            ELSE '📝 Result Submitted'
          END as title,
          CASE 
            WHEN r.approved = true THEN 
              CONCAT('You won ', r."homeScore", ' - ', r."awayScore", ' against ', 
                CASE 
                  WHEN f."homePlayerId" = ${userId} 
                  THEN COALESCE(ap."username", au.name)
                  ELSE COALESCE(hp."username", hu.name)
                END, '!')
            ELSE 
              CONCAT('You submitted a result against ', 
                CASE 
                  WHEN f."homePlayerId" = ${userId} 
                  THEN COALESCE(ap."username", au.name)
                  ELSE COALESCE(hp."username", hu.name)
                END)
          END as description,
          r."createdAt" as timestamp,
          true as read
        FROM "Result" r
        JOIN "Fixture" f ON r."fixtureId" = f.id
        LEFT JOIN "User" hu ON f."homePlayerId" = hu.id
        LEFT JOIN "Profile" hp ON hu.id = hp."userId"
        LEFT JOIN "User" au ON f."awayPlayerId" = au.id
        LEFT JOIN "Profile" ap ON au.id = ap."userId"
        WHERE (f."homePlayerId" = ${userId} OR f."awayPlayerId" = ${userId})
          AND r."createdAt" > NOW() - INTERVAL '30 days'
        ORDER BY r."createdAt" DESC
        LIMIT 5
      `,
      
      // Fixtures
      prisma.$queryRaw<Activity[]>`
        SELECT 
          f.id,
          'FIXTURE' as type,
          CASE 
            WHEN f.status = 'COMPLETED' THEN '✅ Match Completed'
            ELSE '📅 New Fixture'
          END as title,
          CASE 
            WHEN f.status = 'COMPLETED' THEN 
              CONCAT('Match against ', 
                CASE 
                  WHEN f."homePlayerId" = ${userId} 
                  THEN COALESCE(ap."username", au.name)
                  ELSE COALESCE(hp."username", hu.name)
                END, ' is complete')
            ELSE 
              CONCAT('You have a match against ', 
                CASE 
                  WHEN f."homePlayerId" = ${userId} 
                  THEN COALESCE(ap."username", au.name)
                  ELSE COALESCE(hp."username", hu.name)
                END, ' on ', TO_CHAR(f."scheduledDate", 'Mon DD, YYYY'))
          END as description,
          f."scheduledDate" as timestamp,
          true as read
        FROM "Fixture" f
        LEFT JOIN "User" hu ON f."homePlayerId" = hu.id
        LEFT JOIN "Profile" hp ON hu.id = hp."userId"
        LEFT JOIN "User" au ON f."awayPlayerId" = au.id
        LEFT JOIN "Profile" ap ON au.id = ap."userId"
        WHERE (f."homePlayerId" = ${userId} OR f."awayPlayerId" = ${userId})
          AND f."scheduledDate" > NOW() - INTERVAL '30 days'
        ORDER BY f."scheduledDate" DESC
        LIMIT 3
      `,
      
      // Notifications
      prisma.$queryRaw<Activity[]>`
        SELECT 
          n.id,
          n.type,
          n.title,
          n.message as description,
          n."createdAt" as timestamp,
          n.read
        FROM "Notification" n
        WHERE n."userId" = ${userId}
          AND n."createdAt" > NOW() - INTERVAL '30 days'
        ORDER BY n."createdAt" DESC
        LIMIT 3
      `
    ]);

    // ✅ Combine and sort all activities
    const allActivities = [...results, ...fixtures, ...notifications];
    allActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const duration = performance.now() - startTime;
    if (duration > 100) {
      console.log(`📊 Activity fetched in ${duration.toFixed(0)}ms`);
    }

    return NextResponse.json({
      activities: allActivities.slice(0, 10),
      hasMore: allActivities.length > 10,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}