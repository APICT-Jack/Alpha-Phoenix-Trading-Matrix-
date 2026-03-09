const crypto = require('crypto');

exports.seed = function(knex) {
  return knex('users').insert([
    {
      uuid: crypto.randomUUID(),
      name: 'Admin User',
      email: 'admin@alphaphoenix.com',
      password_hash: '$2a$12$EXRkz5PzYVH8EnhZroVrQeR9Mx6wDI7vS7LvL5YJ4nN1JcVY1tW6K', // "password123"
      verified: true
    },
    {
      uuid: crypto.randomUUID(),
      name: 'Demo Trader',
      email: 'demo@alphaphoenix.com',
      password_hash: '$2a$12$EXRkz5PzYVH8EnhZroVrQeR9Mx6wDI7vS7LvL5YJ4nN1JcVY1tW6K',
      verified: true
    }
  ]);
};