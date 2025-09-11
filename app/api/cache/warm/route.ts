import { NextRequest, NextResponse } from 'next/server';
import { CacheWarmer } from '@/lib/cache-warmer';

/**
 * API endpoint to manually trigger cache warming
 * GET /api/cache/warm
 */
export async function GET(request: NextRequest) {
  try {
    await CacheWarmer.refresh();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache warming completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache warming failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cache warming failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}