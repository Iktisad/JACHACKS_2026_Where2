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
      let q = db('access_points as ap')
        .leftJoin('ap_snapshots as s', function () {
          this.on('s.ap_id', '=', 'ap.id').andOn(
            's.epoch',
            '=',
            db.raw('(SELECT MAX(s2.epoch) FROM ap_snapshots s2 WHERE s2.ap_id = ap.id)'),
          );
        })
        .select(
          'ap.id as ap_id',
          'ap.name',
          'ap.building',
          db.raw('COALESCE(s.client_count, 0) as client_count'),
          db.raw('COALESCE(s.wired_client_count, 0) as wired_client_count'),
        );
      if (siteId) q = q.where('ap.site_id', siteId);
      res.json(await q);
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
