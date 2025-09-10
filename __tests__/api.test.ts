import { createMocks } from 'node-mocks-http';
import { GET as automationRatesHandler } from '../app/api/automation-rates/route';
import { GET as testConnectionHandler } from '../app/api/test-connection/route';
import { GET as statsHandler } from '../app/api/stats/route';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

const originalEnv = process.env;

// Mock Next.js request/response
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: async () => data,
      status: options?.status || 200,
      ok: !options?.status || options.status < 400
    }))
  }
}));

describe('API Routes Tests', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    process.env.MONGODB_URI = uri;
    process.env.MONGODB_DB_NAME = 'test_lumos_agent';
    
    client = new MongoClient(uri);
    await client.connect();
  });

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
    process.env = originalEnv;
  });

  beforeEach(async () => {
    const db = client.db('test_lumos_agent');
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  });

  describe('/api/test-connection', () => {
    test('should return successful connection status', async () => {
      const { req } = createMocks({ method: 'GET' });
      
      const response = await testConnectionHandler();
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.message).toBe('MongoDB connection successful');
      expect(data.stats).toBeDefined();
    });

    test('should return database stats', async () => {
      // Insert some test data
      const db = client.db('test_lumos_agent');
      const collection = db.collection('answers');
      
      await collection.insertOne({
        _id: 'test_1',
        qid: 'Q1',
        versions: [
          {
            version_id: 'v1',
            result: { answer: { content: 'test' } },
            generated_from: 'ai',
            created_at: { $date: new Date().toISOString() },
            is_deleted: false
          }
        ],
        created_at: { $date: new Date().toISOString() }
      });

      const response = await testConnectionHandler();
      const data = await response.json();
      
      expect(data.stats.document_count).toBe(1);
      expect(data.stats.sample_document_structure).toBeDefined();
      expect(data.stats.sample_document_structure.hasId).toBe(true);
      expect(data.stats.sample_document_structure.hasQid).toBe(true);
      expect(data.stats.sample_document_structure.hasVersions).toBe(true);
    });
  });

  describe('/api/stats', () => {
    test('should return basic statistics', async () => {
      const response = await statsHandler();
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.total_questions).toBeDefined();
      expect(data.recent_questions).toBeDefined();
      expect(data.questions_with_both_versions).toBeDefined();
      expect(data.last_updated).toBeDefined();
    });

    test('should count documents correctly', async () => {
      const db = client.db('test_lumos_agent');
      const collection = db.collection('answers');
      
      // Insert test documents
      const testDocs = [
        {
          _id: 'test_1',
          qid: 'Q1',
          versions: [
            { generated_from: 'ai', is_deleted: false },
            { generated_from: 'human', is_deleted: false }
          ],
          created_at: { $date: new Date().toISOString() }
        },
        {
          _id: 'test_2',
          qid: 'Q2',
          versions: [
            { generated_from: 'ai', is_deleted: false }
          ],
          created_at: { $date: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() } // 25 hours ago
        }
      ];

      await collection.insertMany(testDocs);

      const response = await statsHandler();
      const data = await response.json();
      
      expect(data.total_questions).toBe(2);
      expect(data.recent_questions).toBe(1); // Only one within 24 hours
    });
  });

  describe('/api/automation-rates', () => {
    test('should return dashboard stats by default', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/automation-rates'
      } as any;

      const response = await automationRatesHandler(mockRequest);
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.total_questions).toBeDefined();
      expect(data.automated_questions).toBeDefined();
      expect(data.overall_automation_rate).toBeDefined();
      expect(data.hourly_rates).toBeDefined();
      expect(data.daily_rates).toBeDefined();
      expect(data.weekly_rates).toBeDefined();
      expect(data.monthly_rates).toBeDefined();
    });

    test('should return filtered rates with period parameter', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/automation-rates?period=day&count=7'
      } as any;

      const response = await automationRatesHandler(mockRequest);
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.rates).toBeDefined();
      expect(Array.isArray(data.rates)).toBe(true);
    });

    test('should handle invalid period parameter', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/automation-rates?period=invalid'
      } as any;

      const response = await automationRatesHandler(mockRequest);
      const data = await response.json();
      
      // Should return dashboard stats for invalid period
      expect(response.ok).toBe(true);
      expect(data.total_questions).toBeDefined();
    });

    test('should handle errors gracefully', async () => {
      // Temporarily break the connection
      const originalUri = process.env.MONGODB_URI;
      process.env.MONGODB_URI = 'invalid_uri';

      const mockRequest = {
        url: 'http://localhost:3000/api/automation-rates'
      } as any;

      const response = await automationRatesHandler(mockRequest);
      
      expect(response.status).toBe(500);
      
      // Restore connection
      process.env.MONGODB_URI = originalUri;
    });
  });

  describe('API Error Handling', () => {
    test('should return proper error format', async () => {
      const originalUri = process.env.MONGODB_URI;
      process.env.MONGODB_URI = 'invalid_connection_string';

      const mockRequest = {
        url: 'http://localhost:3000/api/automation-rates'
      } as any;

      const response = await automationRatesHandler(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch automation rates');
      expect(data.details).toBeDefined();
      expect(data.timestamp).toBeDefined();
      
      process.env.MONGODB_URI = originalUri;
    });
  });
});