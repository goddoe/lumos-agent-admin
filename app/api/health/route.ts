import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/mongodb';

/**
 * Health check endpoint for MongoDB connection
 * GET /api/health
 */
export async function GET() {
  try {
    const isHealthy = await testConnection();
    
    if (isHealthy) {
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'disconnected',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}