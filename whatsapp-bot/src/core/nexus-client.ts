// ============================================= //
// ✅ NEXUS API CLIENT — BOT-SIDE INTEGRATION   //
// ============================================= //
// This is the bot's single point of contact for //
// communicating with the Nexus platform. It     //
// handles auth (shared secret), HTTP requests,  //
// error handling, and retries. Every Nexus data //
// request from a command handler goes through   //
// this client. Never directly into Nexus DB.    //
// ============================================= //

import { createLogger } from "./logger";

const log = createLogger("nexus-client");

// ============================================= //
// ✅ INTERFACES (mirror Nexus API responses)   //
// ============================================= //

export interface NexusHealthResponse {
  status: string;
  version: string;
  database: string;
  activeSeason: {
    id: string;
    name: string;
    status: string;
  } | null;
  playerCount: number;
  timestamp: string;
}

// ============================================= //
// ✅ CUSTOM ERROR TYPE                         //
// ============================================= //

export class NexusApiError extends Error {
  public statusCode: number;
  public endpoint: string;

  constructor(
    message: string,
    statusCode: number,
    endpoint: string
  ) {
    super(message);
    this.name = "NexusApiError";
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

// ============================================= //
// ✅ NEXUS CLIENT                              //
// ============================================= //

export class NexusClient {
  private baseUrl: string;
  private secret: string;
  private defaultTimeoutMs: number = 15_000;

  constructor(baseUrl: string, secret: string) {
    // Normalize: remove trailing slash
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.secret = secret;
  }

  /**
   * Whether the client is properly configured to make requests.
   */
  get isConfigured(): boolean {
    return !!(this.baseUrl && this.secret);
  }

  /**
   * Perform an authenticated GET request to the Nexus API.
   */
  private async get<T>(
    path: string,
    timeoutMs?: number
  ): Promise<T> {
    if (!this.isConfigured) {
      throw new NexusApiError(
        "NexusClient is not configured — set NEXUS_API_URL and NEXUS_API_SECRET",
        0,
        path
      );
    }

    const url = `${this.baseUrl}${path}`;
    const timeout = timeoutMs ?? this.defaultTimeoutMs;

    log.debug({ url }, "Nexus API request");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.secret}`,
          "Content-Type": "application/json",
          "User-Agent": "NexusWhatsAppBot/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorBody: string | undefined;
        try {
          const body: any = await response.json();
          errorBody = body.error || body.message;
        } catch {
          // ignore parse failure
        }

        throw new NexusApiError(
          errorBody || `Nexus API returned ${response.status}`,
          response.status,
          path
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof NexusApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new NexusApiError(
          `Request timed out after ${timeout}ms`,
          408,
          path
        );
      }

      throw new NexusApiError(
        error instanceof Error ? error.message : "Unknown network error",
        0,
        path
      );
    }
  }

  // =========================================== //
  // ✅ PUBLIC API METHODS                       //
  // =========================================== //

  /**
   * Check connectivity and get platform health info.
   * GET /api/integrations/whatsapp
   */
  async getHealth(): Promise<NexusHealthResponse> {
    return this.get<NexusHealthResponse>("/api/integrations/whatsapp");
  }

  // =========================================== //
  // ✅ FIXTURES                                 //
  // =========================================== //

  /**
   * Get fixtures via WhatsApp integration endpoint (Bearer token auth).
   * GET /api/integrations/whatsapp/fixtures
   */
  async getFixtures(): Promise<any> {
    return this.get<any>("/api/integrations/whatsapp/fixtures");
  }

  /**
   * Get a specific fixture by ID.
   * GET /api/fixtures/:id
   */
  async getFixtureById(fixtureId: string): Promise<any> {
    return this.get<any>(`/api/fixtures/${fixtureId}`);
  }

  // =========================================== //
  // ✅ LEAGUE / STANDINGS                       //
  // =========================================== //

  /**
   * Get league standings via WhatsApp integration endpoint (Bearer token auth).
   * GET /api/integrations/whatsapp/standings
   */
  async getStandings(): Promise<any> {
    return this.get<any>("/api/integrations/whatsapp/standings");
  }

  /**
   * Get league table / standings.
   * GET /api/league/table
   */
  async getLeagueTable(): Promise<any> {
    return this.get<any>("/api/league/table");
  }

  /**
   * Get league entries for a season.
   * GET /api/league/entries
   */
  async getLeagueEntries(): Promise<any> {
    return this.get<any>("/api/league/entries");
  }

  // =========================================== //
  // ✅ RESULTS                                  //
  // =========================================== //

  /**
   * Get recent match results via WhatsApp integration endpoint (Bearer token auth).
   * GET /api/integrations/whatsapp/results
   */
  async getResults(): Promise<any> {
    return this.get<any>("/api/integrations/whatsapp/results");
  }

  // =========================================== //
  // ✅ TOURNAMENTS                              //
  // =========================================== //

  /**
   * Get tournaments via WhatsApp integration endpoint (Bearer token auth).
   * GET /api/integrations/whatsapp/tournaments
   */
  async getTournaments(): Promise<any> {
    return this.get<any>("/api/integrations/whatsapp/tournaments");
  }

  /**
   * Get a specific tournament by ID.
   * GET /api/tournaments/:id
   */
  async getTournamentById(tournamentId: string): Promise<any> {
    return this.get<any>(`/api/tournaments/${tournamentId}`);
  }

  // =========================================== //
  // ✅ PLAYERS                                  //
  // =========================================== //

  /**
   * Get players list.
   * GET /api/players
   */
  async getPlayers(): Promise<any> {
    return this.get<any>("/api/players");
  }

  /**
   * Get a specific player by ID.
   * GET /api/players/:id
   */
  async getPlayerById(playerId: string): Promise<any> {
    return this.get<any>(`/api/players/${playerId}`);
  }

  // =========================================== //
  // ✅ SEASONS                                  //
  // =========================================== //

  /**
   * Get seasons via WhatsApp integration endpoint (Bearer token auth).
   * GET /api/integrations/whatsapp/seasons
   */
  async getSeasons(): Promise<any> {
    return this.get<any>("/api/integrations/whatsapp/seasons");
  }

  /**
   * Get a specific season by ID.
   * GET /api/seasons/:id
   */
  async getSeasonById(seasonId: string): Promise<any> {
    return this.get<any>(`/api/seasons/${seasonId}`);
  }
}

/**
 * Singleton accessor — call getNexusClient() after config is loaded.
 */
let _instance: NexusClient | null = null;

export function getNexusClient(): NexusClient {
  if (!_instance) {
    // Use dynamic require for config to avoid circular dependency
    const config = require("../config").config;
    if (!config.nexusApiUrl || !config.nexusApiSecret) {
      throw new Error(
        "NexusClient cannot be initialized: NEXUS_API_URL and NEXUS_API_SECRET must be set"
      );
    }
    _instance = new NexusClient(config.nexusApiUrl, config.nexusApiSecret);
  }
  return _instance;
}

/**
 * Reset the singleton (useful for testing / reconfiguration).
 */
export function resetNexusClient(): void {
  _instance = null;
}
