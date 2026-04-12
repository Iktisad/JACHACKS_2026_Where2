import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add wired_client_count to per-AP snapshots
  await knex.schema.alterTable('ap_snapshots', (t) => {
    t.integer('wired_client_count').notNullable().defaultTo(0);
  });

  // Add per-type totals to site-wide snapshots
  await knex.schema.alterTable('site_snapshots', (t) => {
    t.integer('wireless_clients').notNullable().defaultTo(0);
    t.integer('wired_clients').notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  // SQLite does not support DROP COLUMN natively in older versions;
  // knex handles it via table recreation when using the SQLite dialect.
  await knex.schema.alterTable('ap_snapshots', (t) => {
    t.dropColumn('wired_client_count');
  });

  await knex.schema.alterTable('site_snapshots', (t) => {
    t.dropColumn('wireless_clients');
    t.dropColumn('wired_clients');
  });
}
