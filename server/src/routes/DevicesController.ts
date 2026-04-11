// Stub — implemented in Phase 5
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
    this.router.get('/', (req, res) => this.getAll(req, res));
  }

  // Implemented in Phase 5: SELECT * FROM access_points ORDER BY building, name
  private getAll(_req: Request, res: Response): void {
    res.json([]);
  }
}
