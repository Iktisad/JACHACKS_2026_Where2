import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { Database } from '../db/Database.js';

export class HeatmapController {
  readonly router: Router;

  constructor(private readonly db: Database) {
    this.router = createRouter();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.get('/current', (req, res) => void this.getCurrent(req, res));
    this.router.get('/timeline', (req, res) => void this.getTimeline(req, res));
  }

  private async getCurrent(req: Request, res: Response): Promise<void> {
    try {
      const siteId = req.query['site_id'] as string | undefined;
      const db = this.db.getKnex();

      // Pick the most recent epoch whose data is both *complete* (every known
      // AP has a snapshot row) and *non-zero* (at least one client somewhere).
      // The poller writes all sites in a single transaction, so partial epochs
      // shouldn't appear — but the completeness check is a safety net.
      let apCountQ = db('access_points');
      if (siteId) apCountQ = apCountQ.where('site_id', siteId);
      const apCountRow = await apCountQ.count('* as count').first();
      const expectedApCount = Number(apCountRow?.count ?? 0);

      // Also grab the absolute latest epoch for diagnostics
      const maxEpochRow = await db('ap_snapshots').max('epoch as epoch').first();
      const absoluteLatest = maxEpochRow?.epoch;

      let latestEpoch: number | undefined;
      let pickedBy = 'none';

      if (expectedApCount > 0) {
        // Primary: latest epoch that is complete AND has non-zero totals
        let completenessQ = db('ap_snapshots as s')
          .join('access_points as ap', 'ap.id', 's.ap_id')
          .select('s.epoch')
          .groupBy('s.epoch')
          .havingRaw(
            'COUNT(DISTINCT s.ap_id) >= ? AND SUM(s.client_count) + SUM(s.wired_client_count) > 0',
            [expectedApCount],
          )
          .orderBy('s.epoch', 'desc');
        if (siteId) completenessQ = completenessQ.where('ap.site_id', siteId);
        const completeRow = await completenessQ.first();
        if (completeRow?.epoch) {
          latestEpoch = completeRow.epoch;
          pickedBy = 'complete+nonzero';
        }
      }

      // Fallback: latest epoch with non-zero totals (covers first poll / AP count mismatch)
      if (!latestEpoch) {
        const fallbackRow = await db('ap_snapshots')
          .select('epoch')
          .groupBy('epoch')
          .havingRaw('SUM(client_count) + SUM(wired_client_count) > 0')
          .orderBy('epoch', 'desc')
          .first();
        if (fallbackRow?.epoch) {
          latestEpoch = fallbackRow.epoch;
          pickedBy = 'nonzero-fallback';
        }
      }

      // Last resort: absolute latest epoch (everything genuinely zero)
      if (!latestEpoch) {
        latestEpoch = absoluteLatest;
        pickedBy = 'last-resort';
      }

      console.log(
        `[heatmap] getCurrent: expectedAPs=${expectedApCount}, absoluteLatest=${absoluteLatest}, ` +
        `pickedEpoch=${latestEpoch} (${pickedBy}), age=${absoluteLatest && latestEpoch ? absoluteLatest - latestEpoch : '?'}s behind`,
      );

      if (!latestEpoch) {
        res.json([]);
        return;
      }

      let q = db('access_points as ap')
        .leftJoin('ap_snapshots as s', function () {
          this.on('s.ap_id', '=', 'ap.id').andOn('s.epoch', '=', db.raw('?', [latestEpoch]));
        })
        .select(
          'ap.id as ap_id',
          'ap.name',
          'ap.building',
          db.raw('COALESCE(s.client_count, 0) as client_count'),
          db.raw('COALESCE(s.wired_client_count, 0) as wired_client_count'),
          db.raw('? as epoch', [latestEpoch]),
        );
      if (siteId) q = q.where('ap.site_id', siteId);
      const rows = await q;

      // Log totals for diagnostics
      const totalC = rows.reduce((s: number, r: any) => s + Number(r.client_count) + Number(r.wired_client_count), 0);
      console.log(`[heatmap] getCurrent: serving ${rows.length} APs, totalClients=${totalC}, epoch=${latestEpoch}`);

      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  /**
   * GET /heatmap/timeline?from=&to=&site_id=
   * Returns the distinct epochs in range plus per-AP counts at each epoch.
   * Response: { epochs: number[], snapshots: { ap_id, name, building, epoch, client_count, wired_client_count }[] }
   */
  private async getTimeline(req: Request, res: Response): Promise<void> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const from = Number(req.query['from'] ?? now - 86400);
      const to = Number(req.query['to'] ?? now);
      const siteId = req.query['site_id'] as string | undefined;

      if (isNaN(from) || isNaN(to)) {
        res.status(400).json({ error: 'from and to must be epoch seconds' });
        return;
      }

      const db = this.db.getKnex();

      let q = db('ap_snapshots as s')
        .join('access_points as ap', 'ap.id', 's.ap_id')
        .select(
          'ap.id as ap_id',
          'ap.name',
          'ap.building',
          's.epoch',
          db.raw('CAST(s.client_count AS INTEGER) as client_count'),
          db.raw('CAST(s.wired_client_count AS INTEGER) as wired_client_count'),
        )
        .whereBetween('s.epoch', [from, to])
        .orderBy('s.epoch', 'asc');

      if (siteId) q = q.where('ap.site_id', siteId);

      const rows = await q;

      // Distinct sorted epochs
      const epochs = [...new Set(rows.map((r: { epoch: number }) => Number(r.epoch)))].sort((a, b) => a - b);

      res.json({ epochs, snapshots: rows });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
}
