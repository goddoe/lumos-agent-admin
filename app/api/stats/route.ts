import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection('answers');

    // Get basic statistics
    const [totalQuestions, recentQuestions] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({
        'created_at.$date': {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      })
    ]);

    // Get questions with both AI and human versions
    const questionsWithBothVersions = await collection.countDocuments({
      'versions': {
        $elemMatch: { 'generated_from': 'ai', 'is_deleted': false }
      },
      'versions.1': {
        $exists: true
      }
    });

    return NextResponse.json({
      total_questions: totalQuestions,
      recent_questions: recentQuestions,
      questions_with_both_versions: questionsWithBothVersions,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}