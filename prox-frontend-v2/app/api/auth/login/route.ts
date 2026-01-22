import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken, validateEmail, sanitizeUserData } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const result = await db.query(
      'SELECT id, email, name, created_at, preferences FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 400 }
      );
    }
    
    const user = result.rows[0];
    
    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );
    
    const sanitizedUser = sanitizeUserData(user);
    const token = generateToken(sanitizedUser);
    
    return NextResponse.json({
      user: sanitizedUser,
      token,
      message: 'Logged in successfully'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to log in. Please try again.' },
      { status: 500 }
    );
  }
}