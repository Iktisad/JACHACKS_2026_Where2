import knex, { type Knex } from 'knex';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Config } from '../config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class Database {
  private knexInstance!: Knex;

  constructor(private readonly config: Config) {}

  async connect(): Promise<void> {
    const dbPath = resolve(process.cwd(), this.config.DB_PATH);
    mkdirSync(dirname(dbPath), { recursive: true });

    this.knexInstance = knex({
      client: 'better-sqlite3',
      connection: { filename: dbPath },
      useNullAsDefault: true,
      migrations: {
        directory: resolve(__dirname, 'migrations'),
        extension: 'ts',
        loadExtensions: ['.ts', '.js'],
      },
    });

    await this.knexInstance.migrate.latest();
    console.log(`[db] connected — ${dbPath}`);
  }

  getKnex(): Knex {
    if (!this.knexInstance) throw new Error('[db] not connected — call connect() first');
    return this.knexInstance;
  }

  async close(): Promise<void> {
    if (this.knexInstance) await this.knexInstance.destroy();
  }
}
