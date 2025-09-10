import { NextResponse } from 'next/server';
import { testConnection, getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    // Test basic connection
    const connectionStatus = await testConnection();
    
    if (!connectionStatus) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MongoDB connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Test collection access
    const db = await getDatabase();
    const collection = db.collection('answers');
    
    // Get collection stats
    const stats = await collection.estimatedDocumentCount();
    
    // Get a sample document to understand structure
    const sampleDoc = await collection.findOne({});
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      stats: {
        document_count: stats,
        sample_document_structure: sampleDoc ? {
          hasId: !!sampleDoc._id,
          hasQid: !!sampleDoc.qid,
          hasVersions: !!sampleDoc.versions,
          hasCreatedAt: !!sampleDoc.created_at,
          createdAtType: typeof sampleDoc.created_at,
          versionsCount: sampleDoc.versions?.length || 0
        } : null
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Connection test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}