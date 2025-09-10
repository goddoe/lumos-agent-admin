import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';

// Mock the environment variables BEFORE importing mongodb module
const originalEnv = process.env;
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.MONGODB_DB_NAME = 'test_db';

import { getDatabase, testConnection } from '../lib/mongodb';

describe('MongoDB Connection Tests', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;

  beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Mock environment variables
    process.env.MONGODB_URI = uri;
    process.env.MONGODB_DB_NAME = 'test_lumos_agent';
    
    // Connect to the in-memory database
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_lumos_agent');
  });

  afterAll(async () => {
    // Cleanup
    await client?.close();
    await mongoServer?.stop();
    process.env = originalEnv;
  });

  beforeEach(async () => {
    // Clear any existing data
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  });

  describe('Connection Functions', () => {
    test('should connect to MongoDB successfully', async () => {
      const result = await testConnection();
      expect(result).toBe(true);
    });

    test('should get database instance', async () => {
      const database = await getDatabase();
      expect(database).toBeDefined();
      expect(database.databaseName).toBe('test_lumos_agent');
    });
  });

  describe('Sample Data Operations', () => {
    test('should insert and retrieve sample answer document', async () => {
      const collection = db.collection('answers');
      
      // Insert sample data matching the expected schema
      const sampleAnswer = {
        _id: 'test_question_1',
        qid: 'TEST_001',
        request: {
          messages: [
            {
              role: 'user',
              content: '테스트 질문입니다.'
            }
          ],
          context: {
            company_name: '테스트 회사',
            program: ['TEST']
          }
        },
        versions: [
          {
            version_id: 'v_ai_001',
            result: {
              answer: {
                content: 'AI가 생성한 테스트 답변입니다.'
              }
            },
            generated_from: 'ai',
            created_at: {
              $date: new Date('2024-01-01T10:00:00Z').toISOString()
            },
            created_by: 'ai-system',
            processing_time: 100,
            confidence: 0.9,
            is_deleted: false
          },
          {
            version_id: 'v_human_001',
            result: {
              answer: {
                content: 'AI가 생성한 테스트 답변입니다.'
              }
            },
            generated_from: 'human',
            created_at: {
              $date: new Date('2024-01-01T11:00:00Z').toISOString()
            },
            created_by: 'human-reviewer',
            processing_time: null,
            confidence: null,
            is_deleted: false
          }
        ],
        created_at: {
          $date: new Date('2024-01-01T10:00:00Z').toISOString()
        }
      };

      await collection.insertOne(sampleAnswer);

      // Retrieve and verify
      const retrieved = await collection.findOne({ _id: 'test_question_1' });
      expect(retrieved).toBeDefined();
      expect(retrieved?.qid).toBe('TEST_001');
      expect(retrieved?.versions).toHaveLength(2);
    });

    test('should handle multiple documents with date filtering', async () => {
      const collection = db.collection('answers');
      
      const testDocs = [
        {
          _id: 'test_1',
          qid: 'Q1',
          versions: [],
          created_at: { $date: new Date('2024-01-01').toISOString() }
        },
        {
          _id: 'test_2', 
          qid: 'Q2',
          versions: [],
          created_at: { $date: new Date('2024-01-02').toISOString() }
        },
        {
          _id: 'test_3',
          qid: 'Q3', 
          versions: [],
          created_at: { $date: new Date('2024-01-03').toISOString() }
        }
      ];

      await collection.insertMany(testDocs);

      // Test date range query
      const results = await collection.find({
        'created_at.$date': {
          $gte: new Date('2024-01-01').toISOString(),
          $lte: new Date('2024-01-02').toISOString()
        }
      }).toArray();

      expect(results).toHaveLength(2);
    });
  });
});