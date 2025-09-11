import { NextResponse } from 'next/server';

let initialized = false;

/**
 * Initialize cache warming system
 * This API route will be called by middleware or during server startup
 */
export async function GET() {
  if (initialized) {
    return NextResponse.json({ message: 'Cache warmer already initialized' });
  }

  try {
    // Use dynamic import to avoid bundling issues
    const { CacheWarmer } = await import('@/lib/cache-warmer');
    
    // Start cache warming
    CacheWarmer.start();
    initialized = true;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache warmer initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to initialize cache warmer:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize cache warmer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}