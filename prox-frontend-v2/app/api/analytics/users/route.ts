import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';

    let timeCondition = "created_at > NOW() - INTERVAL '7 days'";
    let activeTimeCondition = "last_login > NOW() - INTERVAL '7 days'";
    
    if (timeframe === '1d') {
      timeCondition = "created_at > NOW() - INTERVAL '1 day'";
      activeTimeCondition = "last_login > NOW() - INTERVAL '1 day'";
    } else if (timeframe === '30d') {
      timeCondition = "created_at > NOW() - INTERVAL '30 days'";
      activeTimeCondition = "last_login > NOW() - INTERVAL '30 days'";
    }

    // Get total users
    const totalUsersResult = await db.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].total);

    // Get new users in timeframe
    const newUsersResult = await db.query(`
      SELECT COUNT(*) as new_users 
      FROM users 
      WHERE ${timeCondition}
    `);
    const newUsers = parseInt(newUsersResult.rows[0].new_users);

    // Get active users in timeframe
    const activeUsersResult = await db.query(`
      SELECT COUNT(*) as active_users 
      FROM users 
      WHERE ${activeTimeCondition}
    `);
    const activeUsers = parseInt(activeUsersResult.rows[0].active_users);

    // Get user growth by day
    const growthResult = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as users
      FROM users 
      WHERE ${timeCondition}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    return NextResponse.json({
      total: totalUsers,
      newThisWeek: newUsers,
      activeThisWeek: activeUsers,
      growth: growthResult.rows,
      timeframe
    });

  } catch (error) {
    console.error('User analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve user analytics' },
      { status: 500 }
    );
  }
}