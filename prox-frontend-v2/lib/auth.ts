import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from './db';

export interface User {
  id: number;
  email: string;
  name: string;
  created_at?: string;
  preferences?: any;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
}

export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return null;
    }

    // Get fresh user data from database
    const result = await db.query(
      'SELECT id, email, name, created_at, preferences FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as User;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return null;
    }

    const result = await db.query(
      'SELECT id, email, name, created_at, preferences FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as User;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeUserData(user: any): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at,
    preferences: user.preferences || {}
  };
}