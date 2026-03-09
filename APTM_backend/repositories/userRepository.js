// src/repositories/userRepository.js
const db = require('../database/postgres');

class UserRepository {
  async create({ name, email, passwordHash, verificationToken }) {
    const { rows } = await db.query(
      `INSERT INTO users (uuid, name, email, password_hash, verification_token)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4)
       RETURNING id, uuid, name, email, verified, created_at`,
      [name, email, passwordHash, verificationToken]
    );
    return rows[0];
  }

  async findByEmail(email) {
    const { rows } = await db.query(
      `SELECT id, uuid, name, email, password_hash, verified, 
              verification_token, created_at
       FROM users WHERE email = $1`,
      [email]
    );
    return rows[0];
  }

  async verifyUser(verificationToken) {
    const { rows } = await db.query(
      `UPDATE users 
       SET verified = true, verification_token = null
       WHERE verification_token = $1
       RETURNING id, uuid, name, email, verified`,
      [verificationToken]
    );
    return rows[0];
  }
}

module.exports = new UserRepository();