import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { Database } from '../db/Database.js';

export class SitesController {
  readonly router: Router;

  constructor(private readonly db: Database) {
    this.router = createRouter();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.get('/', (req, res) => void this.getSites(req, res));
  }

  private async getSites(_req: Request, res: Response): Promise<void> {
    try {
      const rows = await this.db.getKnex()('access_points')
        .distinct('site_id as id', 'site_name as name')
        .whereNotNull('site_id')
        .orderBy('site_name');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
}
