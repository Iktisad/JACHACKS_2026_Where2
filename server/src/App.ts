import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import type { Config } from './config.js';
import type { Database } from './db/Database.js';
import type { PollerService } from './poller/PollerService.js';
import type { SitesController } from './routes/SitesController.js';
import type { DevicesController } from './routes/DevicesController.js';
import type { HistoryController } from './routes/HistoryController.js';
import type { HeatmapController } from './routes/HeatmapController.js';

export class App {
  private readonly express: Application;

  constructor(
    private readonly config: Config,
    private readonly db: Database,
    private readonly poller: PollerService,
    private readonly sitesController: SitesController,
    private readonly devicesController: DevicesController,
    private readonly historyController: HistoryController,
    private readonly heatmapController: HeatmapController,
  ) {
    this.express = express();
    this.applyMiddleware();
    this.registerRoutes();
    this.registerErrorHandler();
  }

  private applyMiddleware(): void {
    this.express.use(cors());
    this.express.use(express.json());
    this.express.use(morgan('dev'));
  }

  private registerRoutes(): void {
    this.express.get('/api/ping', (_req: Request, res: Response) => {
      res.json({ ok: true });
    });

    this.express.use('/api/sites', this.sitesController.router);
    this.express.use('/api/devices', this.devicesController.router);
    this.express.use('/api/history', this.historyController.router);
    this.express.use('/api/heatmap', this.heatmapController.router);
  }

  private registerErrorHandler(): void {
    this.express.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('[error]', err.message);
      res.status(500).json({ error: err.message });
    });
  }

  async start(): Promise<void> {
    await this.db.connect();
    this.poller.start();
    this.express.listen(this.config.PORT, () => {
      console.log(`[server] listening on http://localhost:${this.config.PORT}`);
    });
  }
}
