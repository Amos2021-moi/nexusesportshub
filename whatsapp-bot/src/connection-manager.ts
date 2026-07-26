// ============================================= //
// ✅ CONNECTION STATE MACHINE                  //
// ============================================= //

export enum ConnectionState {
  CONNECTING = "CONNECTING",
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  RECONNECTING = "RECONNECTING",
  LOGGED_OUT = "LOGGED_OUT",
  SHUTTING_DOWN = "SHUTTING_DOWN",
}

// ============================================= //
// ✅ EXPONENTIAL BACKOFF CALCULATOR            //
// ============================================= //

interface BackoffConfig {
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
  jitterFactor: number; // 0–1, adds randomness to avoid thundering herd
}

const DEFAULT_BACKOFF: BackoffConfig = {
  initialDelayMs: 1_000,
  maxDelayMs: 60_000,
  multiplier: 2,
  jitterFactor: 0.2, // ±20% jitter
};

/**
 * Calculate the next backoff delay with jitter.
 * Formula: min(maxDelay, initialDelay * multiplier^attempt) * (1 + random(-jitter, +jitter))
 */
export function calculateBackoff(
  attempt: number,
  config: BackoffConfig = DEFAULT_BACKOFF
): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.multiplier, attempt);
  const clampedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Apply jitter: ±jitterFactor %
  const jitterRange = clampedDelay * config.jitterFactor;
  const jitter = (Math.random() - 0.5) * 2 * jitterRange;

  return Math.round(clampedDelay + jitter);
}

// ============================================= //
// ✅ CONNECTION MANAGER                        //
// ============================================= //

export type StateChangeCallback = (newState: ConnectionState, previousState: ConnectionState) => void;

export class ConnectionManager {
  private _state: ConnectionState = ConnectionState.CLOSED;
  private _previousState: ConnectionState = ConnectionState.CLOSED;
  private _reconnectAttempts = 0;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _shutdownInitiated = false;
  private _onStateChange: StateChangeCallback | null = null;
  private _backoffConfig: BackoffConfig;

  constructor(backoffConfig: Partial<BackoffConfig> = {}) {
    this._backoffConfig = { ...DEFAULT_BACKOFF, ...backoffConfig };
  }

  // ── State management ──────────────────────── //

  get state(): ConnectionState {
    return this._state;
  }

  get previousState(): ConnectionState {
    return this._previousState;
  }

  get reconnectAttempts(): number {
    return this._reconnectAttempts;
  }

  get isShuttingDown(): boolean {
    return this._shutdownInitiated;
  }

  /**
   * Register a callback for state changes.
   */
  onStateChange(callback: StateChangeCallback): void {
    this._onStateChange = callback;
  }

  private setState(newState: ConnectionState): void {
    if (this._state === newState) return;
    this._previousState = this._state;
    this._state = newState;
    this._onStateChange?.(newState, this._previousState);
  }

  // ── State transitions ─────────────────────── //

  setConnecting(): void {
    this.setState(ConnectionState.CONNECTING);
  }

  setOpen(): void {
    this.setState(ConnectionState.OPEN);
    this._reconnectAttempts = 0; // Reset on successful connection
  }

  setClosed(): void {
    this.setState(ConnectionState.CLOSED);
  }

  setLoggedOut(): void {
    this.setState(ConnectionState.LOGGED_OUT);
  }

  // ── Reconnection logic ────────────────────── //

  /**
   * Schedule a reconnection attempt with exponential backoff.
   * Returns the delay in milliseconds before the next attempt.
   * Returns -1 if shutdown is initiated or logged out (no reconnect).
   */
  scheduleReconnect(reconnectFn: () => void): number {
    // Don't reconnect if shutting down or logged out
    if (this._shutdownInitiated) {
      return -1;
    }

    if (this._state === ConnectionState.LOGGED_OUT) {
      return -1;
    }

    this.setState(ConnectionState.RECONNECTING);

    const delay = calculateBackoff(this._reconnectAttempts, this._backoffConfig);
    this._reconnectAttempts++;

    // Clear any existing timer
    this.clearReconnectTimer();

    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      reconnectFn();
    }, delay);

    return delay;
  }

  /**
   * Cancel any pending reconnection.
   */
  cancelReconnect(): void {
    this.clearReconnectTimer();
  }

  private clearReconnectTimer(): void {
    if (this._reconnectTimer !== null) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
  }

  // ── Shutdown ──────────────────────────────── //

  /**
   * Initiate graceful shutdown — cancels reconnection and sets state.
   */
  initiateShutdown(): void {
    this._shutdownInitiated = true;
    this.cancelReconnect();
    this.setState(ConnectionState.SHUTTING_DOWN);
  }

  /**
   * Reset the manager to initial state (e.g., for a full restart).
   */
  reset(): void {
    this.cancelReconnect();
    this._reconnectAttempts = 0;
    this._shutdownInitiated = false;
    this.setState(ConnectionState.CLOSED);
  }
}

// ============================================= //
// ✅ DETERMINE IF A DISCONNECT IS RECOVERABLE  //
// ============================================= //

/**
 * Given a Baileys disconnect status code, determine if we should reconnect.
 *
 * @param statusCode - The Boom output status code from Baileys DisconnectReason
 * @returns true if the bot should attempt reconnection
 */
export function isRecoverableDisconnect(statusCode: number | undefined): boolean {
  // Import DisconnectReason dynamically to avoid hardcoding Baileys dependency here
  // Codes from @whiskeysockets/baileys DisconnectReason enum:
  //    loggedOut = 401
  //    connectionReplaced = 440 (conflict)
  //    connectionClosed = 428
  //    timedOut = 408
  //    badSession = 500

  if (statusCode === undefined) return true; // Assume recoverable if unknown

  // 401 = Logged Out — not recoverable, needs manual re-auth
  if (statusCode === 401) return false;

  // 500 = Bad Session — not recoverable, needs fresh auth
  if (statusCode === 500) return false;

  // All other codes (connectionClosed, timedOut, connectionReplaced, etc.) are recoverable
  return true;
}

// ============================================= //
// ✅ HEALTH STATUS INFO                        //
// ============================================= //

export interface HealthInfo {
  state: ConnectionState;
  reconnectAttempts: number;
  uptimeMs: number;
  connectedSince: string | null;
  isHealthy: boolean;
}

/**
 * Build a health info object for the HTTP health endpoint.
 */
export function buildHealthInfo(manager: ConnectionManager, connectedSince: Date | null): HealthInfo {
  const isHealthy = manager.state === ConnectionState.OPEN;
  return {
    state: manager.state,
    reconnectAttempts: manager.reconnectAttempts,
    uptimeMs: connectedSince ? Date.now() - connectedSince.getTime() : 0,
    connectedSince: connectedSince?.toISOString() || null,
    isHealthy,
  };
}
