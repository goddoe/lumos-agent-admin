import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { 
  calculateAutomationRates, 
  getDashboardStats,
  getAutomationRatesForPeriod 
} from '../lib/automation-calculator';
import { Answer } from '../lib/types';

const originalEnv = process.env;

describe('Automation Calculator Tests', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    process.env.MONGODB_URI = uri;
    process.env.MONGODB_DB_NAME = 'test_lumos_agent';
    
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_lumos_agent');
  });

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
    process.env = originalEnv;
  });

  beforeEach(async () => {
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  });

  const createSampleAnswer = (id: string, qid: string, createdAt: Date, isAutomated: boolean = true): Answer => {
    const aiContent = isAutomated 
      ? '임차료 집행을 위해서는 주관기관의 사전 승인이 필요합니다.'
      : '임차료 관련 문의사항입니다.';
    
    const humanContent = isAutomated
      ? '임차료 집행을 위해서는 주관기관의 사전 공문 승인이 필요합니다.'
      : '사업비 집행 관련 다른 내용입니다.';

    return {
      _id: id,
      qid: qid,
      request: {
        messages: [{ role: 'user', content: '테스트 질문' }],
        context: { company_name: '테스트', program: ['TEST'] }
      },
      versions: [
        {
          version_id: `${id}_ai`,
          result: {
            answer: { content: aiContent }
          },
          generated_from: 'ai',
          created_at: { $date: new Date(createdAt.getTime() - 1000).toISOString() },
          created_by: 'ai-system',
          processing_time: 100,
          confidence: 0.9,
          is_deleted: false
        },
        {
          version_id: `${id}_human`,
          result: {
            answer: { content: humanContent }
          },
          generated_from: 'human',
          created_at: { $date: createdAt.toISOString() },
          created_by: 'human-reviewer',
          processing_time: null,
          confidence: null,
          is_deleted: false
        }
      ],
      created_at: { $date: createdAt.toISOString() }
    };
  };

  describe('calculateAutomationRates', () => {
    test('should calculate hourly automation rates', async () => {
      const collection = db.collection('answers');
      
      const baseDate = new Date('2024-01-01T10:00:00Z');
      const sampleData = [
        createSampleAnswer('1', 'Q1', new Date(baseDate.getTime()), true),
        createSampleAnswer('2', 'Q2', new Date(baseDate.getTime() + 1800000), true), // +30 min
        createSampleAnswer('3', 'Q3', new Date(baseDate.getTime() + 3600000), false), // +1 hour
      ];

      await collection.insertMany(sampleData);

      const startDate = new Date('2024-01-01T10:00:00Z');
      const endDate = new Date('2024-01-01T12:00:00Z');
      
      const rates = await calculateAutomationRates(startDate, endDate, 'hour');
      
      expect(rates).toHaveLength(2);
      expect(rates[0].total_questions).toBe(2);
      expect(rates[0].automated_questions).toBe(2);
      expect(rates[0].automation_rate).toBe(100);
      
      expect(rates[1].total_questions).toBe(1);
      expect(rates[1].automated_questions).toBe(0);
      expect(rates[1].automation_rate).toBe(0);
    });

    test('should handle empty data gracefully', async () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-01T23:59:59Z');
      
      const rates = await calculateAutomationRates(startDate, endDate, 'day');
      expect(rates).toHaveLength(0);
    });

    test('should calculate daily automation rates', async () => {
      const collection = db.collection('answers');
      
      const sampleData = [
        createSampleAnswer('1', 'Q1', new Date('2024-01-01T10:00:00Z'), true),
        createSampleAnswer('2', 'Q2', new Date('2024-01-01T14:00:00Z'), false),
        createSampleAnswer('3', 'Q3', new Date('2024-01-02T10:00:00Z'), true),
      ];

      await collection.insertMany(sampleData);

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-03T00:00:00Z');
      
      const rates = await calculateAutomationRates(startDate, endDate, 'day');
      
      expect(rates).toHaveLength(2);
      expect(rates[0].automation_rate).toBe(50); // 1 automated out of 2
      expect(rates[1].automation_rate).toBe(100); // 1 automated out of 1
    });
  });

  describe('getDashboardStats', () => {
    test('should return comprehensive dashboard statistics', async () => {
      const collection = db.collection('answers');
      
      const now = new Date();
      const sampleData = [
        createSampleAnswer('1', 'Q1', new Date(now.getTime() - 3600000), true), // 1 hour ago
        createSampleAnswer('2', 'Q2', new Date(now.getTime() - 1800000), false), // 30 min ago
        createSampleAnswer('3', 'Q3', new Date(now.getTime() - 86400000), true), // 1 day ago
      ];

      await collection.insertMany(sampleData);

      const stats = await getDashboardStats();
      
      expect(stats.total_questions).toBe(3);
      expect(stats.automated_questions).toBe(2);
      expect(stats.overall_automation_rate).toBeCloseTo(66.67, 1);
      
      expect(stats.hourly_rates).toBeDefined();
      expect(stats.daily_rates).toBeDefined();
      expect(stats.weekly_rates).toBeDefined();
      expect(stats.monthly_rates).toBeDefined();
    });
  });

  describe('getAutomationRatesForPeriod', () => {
    test('should get rates for specific period', async () => {
      const collection = db.collection('answers');
      
      const now = new Date();
      const sampleData = [
        createSampleAnswer('1', 'Q1', new Date(now.getTime() - 3600000), true),
        createSampleAnswer('2', 'Q2', new Date(now.getTime() - 7200000), false),
      ];

      await collection.insertMany(sampleData);

      const rates = await getAutomationRatesForPeriod('day', 1);
      expect(rates).toBeDefined();
      expect(Array.isArray(rates)).toBe(true);
    });

    test('should handle different period types', async () => {
      const dayRates = await getAutomationRatesForPeriod('day', 7);
      const weekRates = await getAutomationRatesForPeriod('week', 4);
      const monthRates = await getAutomationRatesForPeriod('month', 6);
      
      expect(Array.isArray(dayRates)).toBe(true);
      expect(Array.isArray(weekRates)).toBe(true);
      expect(Array.isArray(monthRates)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle answers with only AI versions', async () => {
      const collection = db.collection('answers');
      
      const answerWithOnlyAI: Answer = {
        _id: 'ai_only',
        qid: 'AI_ONLY',
        request: {
          messages: [{ role: 'user', content: '테스트' }],
          context: {}
        },
        versions: [
          {
            version_id: 'ai_v1',
            result: { answer: { content: 'AI 답변' } },
            generated_from: 'ai',
            created_at: { $date: new Date().toISOString() },
            created_by: 'ai',
            processing_time: 100,
            confidence: 0.9,
            is_deleted: false
          }
        ],
        created_at: { $date: new Date().toISOString() }
      };

      await collection.insertOne(answerWithOnlyAI);

      const stats = await getDashboardStats();
      expect(stats.total_questions).toBe(1);
      expect(stats.automated_questions).toBe(0); // No human version to compare
    });

    test('should handle deleted versions', async () => {
      const collection = db.collection('answers');
      
      const answerWithDeletedVersion: Answer = {
        _id: 'deleted_test',
        qid: 'DELETED_TEST',
        request: {
          messages: [{ role: 'user', content: '테스트' }],
          context: {}
        },
        versions: [
          {
            version_id: 'ai_v1',
            result: { answer: { content: 'AI 답변' } },
            generated_from: 'ai',
            created_at: { $date: new Date().toISOString() },
            created_by: 'ai',
            processing_time: 100,
            confidence: 0.9,
            is_deleted: true // Deleted version
          },
          {
            version_id: 'human_v1',
            result: { answer: { content: 'Human 답변' } },
            generated_from: 'human',
            created_at: { $date: new Date().toISOString() },
            created_by: 'human',
            processing_time: null,
            confidence: null,
            is_deleted: false
          }
        ],
        created_at: { $date: new Date().toISOString() }
      };

      await collection.insertOne(answerWithDeletedVersion);

      const stats = await getDashboardStats();
      expect(stats.automated_questions).toBe(0); // AI version is deleted
    });
  });
});