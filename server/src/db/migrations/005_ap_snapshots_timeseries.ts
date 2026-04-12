import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Restore ap_snapshots as a time-series table (needed for heatmap timeline scrubber).
  // Uses a composite primary key on (ap_id, epoch) to prevent duplicates while
  // allowing efficient range queries. Retention is enforced by the poller (30 days).
  await knex.schema.dropTable('ap_snapshots');
  await knex.schema.createTable('ap_snapshots', (t) => {
    t.string('ap_id').notNullable().references('id').inTable('access_points').onDelete('CASCADE');
    t.integer('epoch').notNullable();
    t.integer('client_count').notNullable().defaultTo(0);
    t.integer('wired_client_count').notNullable().defaultTo(0);
    t.primary(['ap_id', 'epoch']);
    t.index(['epoch']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('ap_snapshots');
  await knex.schema.createTable('ap_snapshots', (t) => {
    t.string('ap_id').primary().references('id').inTable('access_points').onDelete('CASCADE');
    t.integer('client_count').notNullable().defaultTo(0);
    t.integer('wired_client_count').notNullable().defaultTo(0);
    t.integer('epoch').notNullable();
  });
}
