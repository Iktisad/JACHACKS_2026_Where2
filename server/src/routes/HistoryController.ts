import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { Database } from '../db/Database.js';

export class HistoryController {
  readonly router: Router;

  constructor(private readonly db: Database) {
    this.router = createRouter();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.get('/', (req, res) => void this.getHistory(req, res));
  }

  private async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const from = Number(req.query['from'] ?? now - 86400);
      const to = Number(req.query['to'] ?? now);
      const apId = req.query['ap_id'] as string | undefined;

      if (isNaN(from) || isNaN(to)) {
        res.status(400).json({ error: 'from and to must be epoch seconds' });
        return;
      }

      const siteId = req.query['site_id'] as string | undefined;
      const db = this.db.getKnex();

      if (apId) {
        const rows = await db('ap_snapshots')
          .select('epoch', 'client_count', 'wired_client_count')
          .where('ap_id', apId)
          .whereBetween('epoch', [from, to])
          .orderBy('epoch', 'asc')
          .limit(2016);
        res.json(rows);
      } else {
        let q = db('site_snapshots')
          .select(
            'epoch',
            'wireless_clients as client_count',
            db.raw('wired_clients as wired_client_count'),
          )
          .whereBetween('epoch', [from, to])
          .orderBy('epoch', 'asc')
          .limit(2016);
        if (siteId) q = q.where('site_id', siteId);
        res.json(await q);
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
}
