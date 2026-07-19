// lib/services/whatsapp.service.ts
const WHATSAPP_WEBHOOK_URL = process.env.WHATSAPP_WEBHOOK_URL || "http://localhost:3001/webhook";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

export async function sendWhatsAppEvent(event: string, data: any) {
  if (!WHATSAPP_WEBHOOK_URL || !WEBHOOK_SECRET) {
    console.log("⚠️ WhatsApp webhook not configured. Skipping...");
    return false;
  }

  try {
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    console.log(`📤 Sending WhatsApp event: ${event}`);

    const response = await fetch(WHATSAPP_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`❌ WhatsApp webhook failed: ${response.status}`);
      return false;
    }

    console.log(`✅ WhatsApp event sent: ${event}`);
    return true;
  } catch (error) {
    console.error("❌ WhatsApp webhook error:", error);
    return false;
  }
}

// ✅ Clean League Table Formatter for WhatsApp
export function formatLeagueTable(standings: any[]): string {
  if (!standings || standings.length === 0) {
    return "📊 *No standings available*";
  }

  let message = "";
  
  // 🏆 Header
  message += "🏆 *LEAGUE STANDINGS*\n";
  message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  
  // Table Header
  message += "┌────┬──────────────────┬────┬────┬────┬────┬─────┐\n";
  message += "│ #  │ Player           │ P  │ W  │ D  │ L  │ Pts │\n";
  message += "├────┼──────────────────┼────┼────┼────┼────┼─────┤\n";
  
  // Rows
  standings.slice(0, 15).forEach((entry, index) => {
    const rank = index + 1;
    
    let name = (entry.player?.profile?.username || entry.player?.name || "Unknown");
    name = name.length > 16 ? name.substring(0, 14) + "…" : name.padEnd(16);
    
    const played = entry.played.toString().padStart(2);
    const wins = entry.wins.toString().padStart(2);
    const draws = entry.draws.toString().padStart(2);
    const losses = entry.losses.toString().padStart(2);
    const points = entry.points.toString().padStart(3);
    
    let rankDisplay = rank.toString().padStart(2);
    if (rank === 1) rankDisplay = "🥇";
    else if (rank === 2) rankDisplay = "🥈";
    else if (rank === 3) rankDisplay = "🥉";
    
    message += `│ ${rankDisplay.padEnd(2)} │ ${name} │ ${played} │ ${wins} │ ${draws} │ ${losses} │ ${points.padStart(3)} │\n`;
  });
  
  // Table Footer
  message += "└────┴──────────────────┴────┴────┴────┴────┴─────┘\n\n";
  
  // 🏅 Top 3
  if (standings.length >= 3) {
    message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    message += "🏅 *PODIUM*\n";
    message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
    const champ = standings[0];
    const champName = (champ?.player?.profile?.username || champ?.player?.name || "Unknown");
    message += `👑 *1st* ${champName} ─ ${champ.points} pts\n`;
    
    if (standings.length > 1) {
      const second = standings[1];
      const secondName = (second?.player?.profile?.username || second?.player?.name || "Unknown");
      message += `🥈 *2nd* ${secondName} ─ ${second.points} pts\n`;
    }
    
    if (standings.length > 2) {
      const third = standings[2];
      const thirdName = (third?.player?.profile?.username || third?.player?.name || "Unknown");
      message += `🥉 *3rd* ${thirdName} ─ ${third.points} pts\n`;
    }
    message += "\n";
  }
  
  // 📊 Stats
  message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  message += `📊 ${standings.length} players  •  ⚽ ${standings.reduce((sum, s) => sum + s.goalsFor, 0)} goals\n`;
  const avgMatches = standings.length > 0 ? Math.round(standings.reduce((sum, s) => sum + s.played, 0) / standings.length) : 0;
  message += `📈 ${avgMatches} avg matches/player\n`;
  message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
  
  return message;
}