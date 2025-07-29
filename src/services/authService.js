import { User } from '../models/User.js';

export const createUser = async (username, password) => {
  const user = await User.create(username, password);
  return user.toJSON();
};

export const authenticateUser = async (username, password) => {
  const user = await User.findByUsername(username);
  if (!user) {
    throw new Error('User not found');
  }
  
  const isValid = await user.validatePassword(password);
  if (!isValid) {
    throw new Error('Invalid password');
  }
  
  return user.toJSON();
};