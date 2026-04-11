// Stub — implemented in Phase 5
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
    this.router.get('/', (req, res) => this.getHistory(req, res));
  }

  // Implemented in Phase 5:
  // - No ap_id: query site_snapshots WHERE captured_at BETWEEN from AND to
  // - With ap_id: query ap_snapshots for that AP
  private getHistory(_req: Request, res: Response): void {
    res.json([]);
  }
}
