import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest, sanitizeUserData } from '@/lib/auth';

// POST - Update user preferences
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { preferences } = await request.json();

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Valid preferences object is required' },
        { status: 400 }
      );
    }

    // Update user preferences in database
    const result = await db.query(`
      UPDATE users 
      SET preferences = $1, last_login = NOW()
      WHERE id = $2
      RETURNING id, email, name, created_at, preferences
    `, [JSON.stringify(preferences), user.id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updatedUser = sanitizeUserData(result.rows[0]);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

// GET - Retrieve user preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await db.query(`
      SELECT id, email, name, created_at, preferences, last_login
      FROM users 
      WHERE id = $1
    `, [user.id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = sanitizeUserData(result.rows[0]);

    return NextResponse.json({
      success: true,
      user: userData,
      preferences: userData.preferences || {}
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve preferences' },
      { status: 500 }
    );
  }
}