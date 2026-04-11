import type { UnifiApiService } from '../unifi/UnifiApiService.js';
import type { Database } from '../db/Database.js';

export class PollerService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly INTERVAL_MS = 5 * 60 * 1000;

  constructor(
    private readonly unifiApi: UnifiApiService,
    private readonly db: Database,
  ) {}

  start(): void {
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

  private async tick(): Promise<void> {
    try {
      const db = this.db.getKnex();

      // 1. Fetch all devices, filter to APs only
      const devices = await this.unifiApi.fetchDevices();
      const aps = devices.filter((d) => d.features.includes('accessPoint'));

      // 2. Upsert access points — never overwrite map_x / map_y
      for (const ap of aps) {
        await db('access_points')
          .insert({
            id: ap.id,
            mac_address: ap.macAddress,
            name: ap.name,
            model: ap.model,
            building: this.getBuilding(ap.name),
            updated_at: new Date().toISOString(),
          })
          .onConflict('id')
          .merge(['mac_address', 'name', 'model', 'building', 'updated_at']);
      }

      // 3. Fetch wireless clients, group by uplinkDeviceId
      const clients = await this.unifiApi.fetchWirelessClients();
      const countById = new Map<string, number>();
      for (const c of clients) {
        countById.set(c.uplinkDeviceId, (countById.get(c.uplinkDeviceId) ?? 0) + 1);
      }

      // 4. Bulk insert ap_snapshots
      const epoch = Math.floor(Date.now() / 1000);
      const snapshots = aps.map((ap) => ({
        ap_id: ap.id,
        client_count: countById.get(ap.id) ?? 0,
        epoch,
      }));
      if (snapshots.length > 0) await db('ap_snapshots').insert(snapshots);

      // 5. Insert site_snapshot
      const totalClients = [...countById.values()].reduce((a, b) => a + b, 0);
      await db('site_snapshots').insert({ total_clients: totalClients, epoch });

      console.log(`[poller] tick — ${aps.length} APs, ${totalClients} wireless clients`);
    } catch (err) {
      console.error('[poller] tick error:', err);
    }
  }

  private getBuilding(name: string): string {
    const n = name.toLowerCase();
    if (n.startsWith('li')) return 'Library';
    if (n.startsWith('he')) return 'Herzberg';
    return 'Unknown';
  }
}
