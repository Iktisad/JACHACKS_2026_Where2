export class Config {
  private static instance: Config;

  readonly UNIFI_API_KEY: string;
  readonly UNIFI_BASE_URL: string;
  readonly PORT: number;
  readonly DB_PATH: string;

  private constructor() {
    this.UNIFI_API_KEY = this.requireEnv('UNIFI_API_KEY');
    this.UNIFI_BASE_URL = this.requireEnv('UNIFI_BASE_URL');
    this.PORT = Number(process.env['PORT'] ?? 3001);
    this.DB_PATH = process.env['DB_PATH'] ?? './data/app.db';
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
