import users from '../data/users.json';
import type { User, LoginCredentials } from './api';

export function authenticate(credentials: LoginCredentials): User | null {
  const user = users.users.find(u => 
    u.username === credentials.username && 
    u.password === credentials.password
  );

  if (!user) return null;

  return {
    username: user.username,
    isAdmin: user.isAdmin
  };
}

export function isConfigured(): boolean {
  return users.users.length > 0;
}