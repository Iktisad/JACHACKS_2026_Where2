import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('access_points', (t) => {
    t.string('site_id').nullable();
    t.string('site_name').nullable();
    t.index(['site_id']);
  });

  await knex.schema.alterTable('site_snapshots', (t) => {
    t.string('site_id').nullable();
    t.string('site_name').nullable();
    t.index(['site_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('access_points', (t) => {
    t.dropIndex(['site_id']);
    t.dropColumn('site_id');
    t.dropColumn('site_name');
  });

  await knex.schema.alterTable('site_snapshots', (t) => {
    t.dropIndex(['site_id']);
    t.dropColumn('site_id');
    t.dropColumn('site_name');
  });
}
