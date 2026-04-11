// Stub — implemented in Phase 5
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
    this.router.get('/current', (req, res) => this.getCurrent(req, res));
  }

  // Implemented in Phase 5:
  // JOIN access_points with latest ap_snapshots per AP (MAX captured_at subquery)
  private getCurrent(_req: Request, res: Response): void {
    res.json([]);
  }
}
