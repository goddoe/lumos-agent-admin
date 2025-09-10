import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Answer } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection<Answer>('answers');
    
    // Get all answers without any date filter
    const allAnswers = await collection.find({}).toArray();
    
    console.log('Total answers in DB:', allAnswers.length);
    
    if (allAnswers.length > 0) {
      // Check first few answers
      const firstAnswer = allAnswers[0];
      console.log('First answer created_at:', firstAnswer.created_at);
      console.log('First answer structure:', {
        _id: firstAnswer._id,
        qid: firstAnswer.qid,
        versions_count: firstAnswer.versions.length,
        created_at: firstAnswer.created_at
      });
    }
    
    // Get distinct dates to see the range of data
    const dates = allAnswers.map(answer => {
      const dateStr = typeof answer.created_at === 'object' && '$date' in answer.created_at 
        ? answer.created_at.$date 
        : answer.created_at;
      return new Date(dateStr);
    }).sort((a, b) => a.getTime() - b.getTime());
    
    const dateRange = dates.length > 0 ? {
      earliest: dates[0],
      latest: dates[dates.length - 1]
    } : null;
    
    return NextResponse.json({
      total_answers: allAnswers.length,
      date_range: dateRange,
      sample_answer: allAnswers.length > 0 ? {
        created_at: allAnswers[0].created_at,
        versions_count: allAnswers[0].versions.length,
        qid: allAnswers[0].qid
      } : null
    });
    
  } catch (error) {
    console.error('Debug data error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch debug data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}