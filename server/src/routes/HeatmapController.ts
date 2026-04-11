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
  }

  private async getCurrent(_req: Request, res: Response): Promise<void> {
    try {
      const db = this.db.getKnex();
      const rows = await db('access_points as ap')
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
          'ap.map_x',
          'ap.map_y',
          db.raw('COALESCE(s.client_count, 0) as client_count'),
        );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
}
