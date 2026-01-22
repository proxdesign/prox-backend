import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken, validateEmail, sanitizeUserData } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    
    // Validate input
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }
    
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }
    
    // Create new user
    const result = await db.query(
      `INSERT INTO users (email, name, created_at, last_login, preferences) 
       VALUES ($1, $2, NOW(), NOW(), '{}') 
       RETURNING id, email, name, created_at, preferences`,
      [email.toLowerCase(), name.trim()]
    );
    
    const newUser = result.rows[0];
    const sanitizedUser = sanitizeUserData(newUser);
    const token = generateToken(sanitizedUser);
    
    return NextResponse.json({
      user: sanitizedUser,
      token,
      message: 'Account created successfully'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}