import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('access_points', (t) => {
    t.dropColumn('map_x');
    t.dropColumn('map_y');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('access_points', (t) => {
    t.float('map_x').nullable();
    t.float('map_y').nullable();
  });
}
