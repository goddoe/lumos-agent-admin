import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Answer } from '@/lib/types';

function getLatestVersions(answer: Answer) {
  const aiVersions = answer.versions
    .filter(v => v.generated_from === 'ai' && !v.is_deleted)
    .sort((a, b) => {
      const dateA = new Date(typeof a.created_at === 'object' && '$date' in a.created_at ? a.created_at.$date : a.created_at).getTime();
      const dateB = new Date(typeof b.created_at === 'object' && '$date' in b.created_at ? b.created_at.$date : b.created_at).getTime();
      return dateB - dateA;
    });
  
  const humanVersions = answer.versions
    .filter(v => v.generated_from === 'human' && !v.is_deleted)
    .sort((a, b) => {
      const dateA = new Date(typeof a.created_at === 'object' && '$date' in a.created_at ? a.created_at.$date : a.created_at).getTime();
      const dateB = new Date(typeof b.created_at === 'object' && '$date' in b.created_at ? b.created_at.$date : b.created_at).getTime();
      return dateB - dateA;
    });

  return {
    ai: aiVersions[0],
    human: humanVersions[0]
  };
}

function isAutomated(answer: Answer): boolean {
  const { ai, human } = getLatestVersions(answer);
  return !!(ai && human);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all'; // 'all', 'automated', 'manual'
    
    const db = await getDatabase();
    const collection = db.collection<Answer>('answers');
    
    // Build query
    let query: any = {};
    
    // Search in question content
    if (search) {
      query['request.messages.content'] = {
        $regex: search,
        $options: 'i'
      };
    }
    
    // Get all answers first to apply automation filter
    const allAnswers = await collection.find(query).toArray();
    
    // Apply automation filter
    let filteredAnswers = allAnswers;
    if (filter === 'automated') {
      filteredAnswers = allAnswers.filter(answer => isAutomated(answer));
    } else if (filter === 'manual') {
      filteredAnswers = allAnswers.filter(answer => !isAutomated(answer));
    }
    
    // Calculate pagination
    const total = filteredAnswers.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    
    // Sort by creation date (newest first) and paginate
    const paginatedAnswers = filteredAnswers
      .sort((a, b) => {
        const dateA = new Date(typeof a.created_at === 'object' && '$date' in a.created_at ? a.created_at.$date : a.created_at).getTime();
        const dateB = new Date(typeof b.created_at === 'object' && '$date' in b.created_at ? b.created_at.$date : b.created_at).getTime();
        return dateB - dateA;
      })
      .slice(skip, skip + limit);
    
    return NextResponse.json({
      answers: paginatedAnswers,
      total,
      page,
      limit,
      totalPages
    });
    
  } catch (error) {
    console.error('Error fetching responses:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch responses',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}