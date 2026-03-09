exports.up = function(knex) {
    return knex.schema
      .createTable('users', (table) => {
        table.increments('id').primary();
        table.uuid('uuid').notNullable().unique();
        table.string('name', 100).notNullable();
        table.string('email', 255).notNullable().unique();
        table.string('password_hash').notNullable();
        table.boolean('verified').defaultTo(false);
        table.string('verification_token', 100);
        table.string('reset_token', 100);
        table.timestamp('reset_token_expires');
        table.timestamps(true, true);
      })
      .createTable('trades', (table) => {
        table.increments('id').primary();
        table.uuid('user_id').references('uuid').inTable('users');
        table.string('symbol', 10).notNullable();
        table.string('trade_type', 4).notNullable(); // BUY/SELL
        table.decimal('entry_price', 19, 8).notNullable();
        table.decimal('exit_price', 19, 8);
        table.timestamp('entry_time').notNullable();
        table.timestamp('exit_time');
        table.string('status', 20).defaultTo('ACTIVE'); // ACTIVE/CLOSED
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTable('trades')
      .dropTable('users');
  };