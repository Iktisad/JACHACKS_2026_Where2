// Stub — implemented in Phase 4
import type { UnifiApiService } from '../unifi/UnifiApiService.js';
import type { Database } from '../db/Database.js';

export class PollerService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly unifiApi: UnifiApiService,
    private readonly db: Database,
  ) {}

  start(): void {
    // Run immediately on startup, then every 5 minutes
    void this.tick();
    this.intervalId = setInterval(() => void this.tick(), this.INTERVAL_MS);
    console.log('[poller] started (every 5 min)');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[poller] stopped');
    }
  }

  // Implemented in Phase 4: fetches devices + clients, writes snapshots
  private async tick(): Promise<void> {
    console.log('[poller] stub tick — not yet implemented');
    // Will use: this.unifiApi.fetchDevices(), this.unifiApi.fetchWirelessClients()
    // Will use: this.db.getKnex() to insert into ap_snapshots, site_snapshots
  }
}
