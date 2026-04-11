import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { Database } from '../db/Database.js';

export class DevicesController {
  readonly router: Router;

  constructor(private readonly db: Database) {
    this.router = createRouter();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.get('/', (req, res) => void this.getAll(req, res));
  }

  private async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const rows = await this.db.getKnex()('access_points')
        .orderBy([{ column: 'building' }, { column: 'name' }]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
}
