export class Config {
  private static instance: Config;

  readonly UNIFI_API_KEY: string;
  readonly UNIFI_BASE_URL: string;
  readonly PORT: number;
  readonly DB_PATH: string;

  // Gemini Developer API
  readonly GEMINI_API_KEY: string;
  readonly GEMINI_MODEL: string;
  readonly GEMINI_MAX_TOKENS: number;
  readonly GEMINI_TEMPERATURE: number;
  readonly GEMINI_TOP_P: number;
  readonly GEMINI_TIMEOUT_MS: number;

  private constructor() {
    this.UNIFI_API_KEY = this.requireEnv('UNIFI_API_KEY');
    this.UNIFI_BASE_URL = this.requireEnv('UNIFI_BASE_URL');
    this.PORT = Number(process.env['PORT'] ?? 3001);
    this.DB_PATH = process.env['DB_PATH'] ?? './data/app.db';
    this.GEMINI_API_KEY = this.requireEnv('GEMINI_API_KEY');
    this.GEMINI_MODEL = process.env['GEMINI_MODEL']?.trim() ?? 'gemini-2.0-flash';
    this.GEMINI_MAX_TOKENS = Number(process.env['GEMINI_MAX_TOKENS'] ?? 1024);
    this.GEMINI_TEMPERATURE = Number(process.env['GEMINI_TEMPERATURE'] ?? 0.7);
    this.GEMINI_TOP_P = Number(process.env['GEMINI_TOP_P'] ?? 0.9);
    this.GEMINI_TIMEOUT_MS = Number(process.env['GEMINI_TIMEOUT_MS'] ?? 60000);
  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
  }
}
