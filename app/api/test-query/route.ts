import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Answer } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection<Answer>('answers');
    
    const dataStartDate = new Date('2025-07-22T00:00:00.000Z');
    const dataEndDate = new Date('2025-09-10T23:59:59.999Z');
    
    console.log('Testing date query from', dataStartDate, 'to', dataEndDate);
    
    // Test different query approaches
    const query1 = await collection.find({
      'created_at': {
        $gte: dataStartDate,
        $lte: dataEndDate
      }
    }).toArray();
    
    const query2 = await collection.find({
      'created_at': {
        $gte: dataStartDate.toISOString(),
        $lte: dataEndDate.toISOString()
      }
    }).toArray();
    
    const query3 = await collection.find({}).limit(5).toArray();
    
    return NextResponse.json({
      query1_results: query1.length,
      query2_results: query2.length,
      sample_dates: query3.map(item => ({
        created_at: item.created_at,
        type: typeof item.created_at
      }))
    });
    
  } catch (error) {
    console.error('Test query error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test query',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}