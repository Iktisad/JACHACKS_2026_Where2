import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('access_points', (t) => {
    t.string('id').primary();          // UniFi device UUID
    t.string('mac_address').notNullable().unique();
    t.string('name').notNullable();
    t.string('model').notNullable();
    t.string('building').notNullable(); // 'Library' | 'Herzberg' | 'Unknown'
    t.float('map_x').nullable();        // pixel coords for floor plan overlay
    t.float('map_y').nullable();
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('ap_snapshots', (t) => {
    t.increments('id');
    t.string('ap_id').notNullable().references('id').inTable('access_points').onDelete('CASCADE');
    t.integer('client_count').notNullable().defaultTo(0);
    t.integer('epoch').notNullable();   // Unix seconds
    t.index(['ap_id', 'epoch']);
  });

  await knex.schema.createTable('site_snapshots', (t) => {
    t.increments('id');
    t.integer('total_clients').notNullable().defaultTo(0);
    t.integer('epoch').notNullable();
    t.index(['epoch']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ap_snapshots');
  await knex.schema.dropTableIfExists('site_snapshots');
  await knex.schema.dropTableIfExists('access_points');
}
