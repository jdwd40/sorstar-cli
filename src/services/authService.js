import bcrypt from 'bcrypt';
import { query } from '../utils/database.js';

export const createUser = async (username, password) => {
  const existingUser = await query('SELECT id FROM users WHERE username = $1', [username]);
  if (existingUser.rows.length > 0) {
    throw new Error('Username already exists');
  }
  
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  const result = await query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
    [username, passwordHash]
  );
  
  return result.rows[0];
};

export const authenticateUser = async (username, password) => {
  const result = await query(
    'SELECT id, username, password_hash FROM users WHERE username = $1',
    [username]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isValid) {
    throw new Error('Invalid password');
  }
  
  return { id: user.id, username: user.username };
};