import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// DELETE - Remove saved product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { productId } = await params;
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Remove the saved product
    const result = await db.query(
      'DELETE FROM saved_products WHERE user_id = $1 AND product_id = $2 RETURNING id',
      [user.id, productId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found in saved items' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Product removed from saved items'
    });
    
  } catch (error) {
    console.error('Failed to remove saved product:', error);
    return NextResponse.json(
      { error: 'Failed to remove saved product' },
      { status: 500 }
    );
  }
}