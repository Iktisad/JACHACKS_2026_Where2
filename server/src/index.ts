import { Config } from './config.js';
import { Database } from './db/Database.js';
import { UnifiApiService } from './unifi/UnifiApiService.js';
import { PollerService } from './poller/PollerService.js';
import { DevicesController } from './routes/DevicesController.js';
import { HistoryController } from './routes/HistoryController.js';
import { HeatmapController } from './routes/HeatmapController.js';
import { App } from './App.js';

// Composition root — wire all dependencies here, inject everywhere else
const config = Config.getInstance();
const db = new Database(config);
const unifiApi = new UnifiApiService(config);
const poller = new PollerService(unifiApi, db);
const devicesController = new DevicesController(db);
const historyController = new HistoryController(db);
const heatmapController = new HeatmapController(db);

const app = new App(config, db, poller, devicesController, historyController, heatmapController);

app.start().catch((err: unknown) => {
  console.error('[fatal]', err);
  process.exit(1);
});
