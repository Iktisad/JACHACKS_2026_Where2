import { Config } from './config.js';
import { Database } from './db/Database.js';
import { UnifiApiService } from './unifi/UnifiApiService.js';
import { PollerService } from './poller/PollerService.js';
import { SitesController } from './routes/SitesController.js';
import { DevicesController } from './routes/DevicesController.js';
import { HistoryController } from './routes/HistoryController.js';
import { HeatmapController } from './routes/HeatmapController.js';
import { AiController } from './routes/AiController.js';
import { UsersController } from './routes/UsersController.js';
import { GeminiService } from './ai/GeminiService.js';
import { App } from './App.js';

// Composition root — wire all dependencies here, inject everywhere else
const config = Config.getInstance();
const db = new Database(config);
const unifiApi = new UnifiApiService(config);
const poller = new PollerService(unifiApi, db);
const sitesController = new SitesController(db);
const devicesController = new DevicesController(db);
const historyController = new HistoryController(db);
const heatmapController = new HeatmapController(db);
const geminiService = new GeminiService({
  apiKey: config.GEMINI_API_KEY,
  model: config.GEMINI_MODEL,
  maxOutputTokens: config.GEMINI_MAX_TOKENS,
  temperature: config.GEMINI_TEMPERATURE,
  topP: config.GEMINI_TOP_P,
  timeoutMs: config.GEMINI_TIMEOUT_MS,
});
const aiController = new AiController(db, geminiService);
const usersController = new UsersController(db);

const app = new App(config, db, poller, sitesController, devicesController, historyController, heatmapController, aiController, usersController);

app.start().catch((err: unknown) => {
  console.error('[fatal]', err);
  process.exit(1);
});
