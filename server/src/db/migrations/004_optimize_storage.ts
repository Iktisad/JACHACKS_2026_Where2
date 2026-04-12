import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Rebuild ap_snapshots: one row per AP (latest only), with a unique constraint
  //    so the poller can UPSERT instead of endlessly appending rows.
  await knex.schema.dropTable('ap_snapshots');
  await knex.schema.createTable('ap_snapshots', (t) => {
    t.string('ap_id').primary().references('id').inTable('access_points').onDelete('CASCADE');
    t.integer('client_count').notNullable().defaultTo(0);
    t.integer('wired_client_count').notNullable().defaultTo(0);
    t.integer('epoch').notNullable();
  });

  // 2. Drop redundant columns from site_snapshots
  await knex.schema.alterTable('site_snapshots', (t) => {
    t.dropColumn('total_clients');
    t.dropColumn('site_name');
  });

  // 3. Add composite unique index to prevent duplicate site snapshots per tick
  await knex.schema.alterTable('site_snapshots', (t) => {
    t.unique(['site_id', 'epoch']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Restore ap_snapshots as append-only
  await knex.schema.dropTable('ap_snapshots');
  await knex.schema.createTable('ap_snapshots', (t) => {
    t.increments('id');
    t.string('ap_id').notNullable().references('id').inTable('access_points').onDelete('CASCADE');
    t.integer('client_count').notNullable().defaultTo(0);
    t.integer('wired_client_count').notNullable().defaultTo(0);
    t.integer('epoch').notNullable();
    t.index(['ap_id', 'epoch']);
  });

  // Restore dropped columns
  await knex.schema.alterTable('site_snapshots', (t) => {
    t.dropUnique(['site_id', 'epoch']);
    t.integer('total_clients').notNullable().defaultTo(0);
    t.string('site_name').nullable();
  });
}
