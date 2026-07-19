// lib/services/event.service.ts
import { sendWhatsAppEvent, formatLeagueTable } from "./whatsapp.service";

type EventType = 
  | "season.created"
  | "fixtures.generated"
  | "result.approved"
  | "payment.confirmed"
  | "tournament.created"
  | "news.published"
  | "award.earned"
  | "season.champion"
  | "maintenance.start"
  | "standings.updated";

interface EventData {
  [key: string]: any;
}

export class EventService {
  private static instance: EventService;
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = process.env.WHATSAPP_ENABLED === "true";
    console.log(`📡 Event Service initialized. WhatsApp: ${this.isEnabled ? "✅ ENABLED" : "❌ DISABLED"}`);
  }

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  public async emit(event: EventType, data: EventData) {
    console.log(`📡 Event emitted: ${event}`);

    // Send to WhatsApp if enabled
    if (this.isEnabled) {
      // ✅ Special handling for standings.updated
      if (event === "standings.updated") {
        const standings = data.standings;
        const seasonName = data.seasonName || "Current Season";
        const tableMessage = formatLeagueTable(standings);
        
        // Send as a formatted message
        await sendWhatsAppEvent(event, { 
          message: `📊 *${seasonName} Standings Updated*\n\n${tableMessage}` 
        });
      } else {
        const result = await sendWhatsAppEvent(event, data);
        if (result) {
          console.log(`✅ WhatsApp notification sent for: ${event}`);
        } else {
          console.log(`❌ WhatsApp notification failed for: ${event}`);
        }
      }
    } else {
      console.log(`⚠️ WhatsApp is disabled. Event logged but not sent.`);
    }

    return { success: true, event };
  }
}

export const eventService = EventService.getInstance();