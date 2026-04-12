import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (t) => {
    t.string('uid').primary();           // email used as uid
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('avatar').notNullable();
    t.string('password_hash').notNullable();
    t.integer('tokens').notNullable().defaultTo(0);
    t.integer('rank').notNullable().defaultTo(99);
    t.integer('total_sessions').notNullable().defaultTo(0);
    t.integer('study_hours').notNullable().defaultTo(0);
    t.integer('spaces_visited').notNullable().defaultTo(0);
    t.integer('streak').notNullable().defaultTo(0);
    t.string('created_at').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
