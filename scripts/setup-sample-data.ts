import { MongoClient } from 'mongodb';
import { Answer } from '../lib/types';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:@basedatabaseforsj@cluster0.0pxqicu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = process.env.MONGODB_DB_NAME || 'lumos_agent';

async function createSampleData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection<Answer>('answers');
    
    // Clear existing data (be careful in production!)
    await collection.deleteMany({});
    console.log('Cleared existing data');
    
    // Generate sample data
    const sampleAnswers: Answer[] = [];
    const companies = ['올담', '테크노벨리', '이노베이션랩', '스마트솔루션'];
    const programs = ['LIPS', 'R&D', 'SBIR', 'KOSBIR'];
    
    const questions = [
      '임차료 현물 부분에서 사업관련성 및 필요성 검토를 위한 주관기관 사전 공문 승인 양식이 있나요?',
      '비교견적서 발행이 불가한 임차료 및 관리비의 경우 어떻게 처리해야 하나요?',
      '사업비 집행 시 필요한 서류는 무엇인가요?',
      '연구개발비 중 재료비 집행 기준이 궁금합니다.',
      '장비구입 시 자산등록 절차는 어떻게 되나요?',
      '인건비 지급 시 주의사항이 있나요?',
      '출장비 정산 관련 문의사항입니다.',
      '연구과제 변경승인은 언제 받아야 하나요?'
    ];
    
    const aiResponses = [
      '임차료 집행을 위해서는 사업관련성 및 필요성을 설명하는 문서를 준비하여 주관기관에 사전 문의하시고, 필요한 서류나 양식을 확인하신 후 제출하시면 됩니다.',
      '임차료 및 관리비의 경우 동일한 조건 비교가 어려우므로, 주관기관과 협의하여 임대차 계약서, 시장 가격 조사 자료 등을 대체 증빙자료로 활용할 수 있습니다.',
      '사업비 집행을 위해서는 비교견적서, 세금계산서, 통장사본, 계좌이체확인서 등의 증빙서류가 필요하며, 사업 특성에 따라 추가 서류가 요구될 수 있습니다.',
      '재료비는 연구개발 목적으로 직접 사용되는 재료에 한해 집행 가능하며, 소모성 재료와 내구연한 1년 미만 또는 단가 50만원 미만의 비품이 포함됩니다.',
      '50만원 이상의 장비는 자산등록이 필요하며, 구입 후 30일 이내에 자산등록 신청서와 구매 증빙서류를 제출하셔야 합니다.',
      '인건비는 실제 연구에 참여한 시간에 대해서만 지급 가능하며, 4대보험 및 소득세 원천징수 등 관련 법규를 준수해야 합니다.',
      '출장비는 사전 승인된 출장계획에 따라 집행되어야 하며, 숙박비, 교통비, 일비 등에 대한 영수증과 출장복명서를 제출해야 합니다.',
      '연구과제의 중요한 변경사항(연구책임자, 연구기간, 총 연구비 등)이 발생할 경우 사전에 변경승인을 받아야 하며, 경미한 변경은 사후 보고가 가능합니다.'
    ];
    
    const humanResponses = [
      '임차료 집행을 위해서는 사업관련성 및 필요성을 설명하는 문서를 준비하여 주관기관에 사전 문의하시고, 해당 기관에서 요구하는 양식에 따라 제출하시면 됩니다.',
      '임차료 및 관리비의 경우 동일 조건 비교가 어려우므로, 주관기관과 협의하여 임대차 계약서, 시장 조사 자료 등을 대체 증빙으로 활용할 수 있습니다.',
      '사업비 집행시에는 비교견적서, 세금계산서, 통장사본, 이체확인서 등이 필요하며, 과제 특성에 따라 추가 서류가 요구됩니다.',
      '재료비는 연구목적으로 직접 사용되는 재료에 한해 집행 가능하며, 소모성 재료와 내구연한 1년 미만 또는 단가 50만원 미만 비품이 해당됩니다.',
      '50만원 이상 장비는 자산등록 필요하며, 구입 후 30일 이내 자산등록 신청서와 구매 증빙을 제출해야 합니다.',
      '인건비는 실제 연구참여 시간에 대해서만 지급하며, 4대보험 및 소득세 원천징수 등 관련 법규를 준수해야 합니다.',
      '출장비는 사전 승인된 계획에 따라 집행하며, 숙박비, 교통비, 일비 영수증과 출장복명서를 제출해야 합니다.',
      '연구과제 중요 변경사항 발생시 사전 변경승인 필요하며, 경미한 변경은 사후 보고 가능합니다.'
    ];
    
    // Create sample data for the past 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < 100; i++) {
      const questionIndex = i % questions.length;
      const companyIndex = i % companies.length;
      const programIndex = i % programs.length;
      
      // Random date within the last 30 days
      const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
      const createdAt = new Date(randomTime);
      
      // 80% chance of being automated (similar responses)
      const isAutomated = Math.random() < 0.8;
      
      const aiVersion = {
        version_id: `v_ai_${i}`,
        result: {
          workflow_name: 'DefaultWorkflow',
          question: questions[questionIndex],
          question_type: 'A',
          question_category: '기타',
          program: programs[programIndex],
          answer: {
            content: aiResponses[questionIndex],
            evidences: [],
            forms: [],
            additional_actions: [],
            confidence: 0.8 + Math.random() * 0.2,
            evidence_summary: {}
          },
          metadata: {},
          thoughts: [],
          todos: []
        },
        generated_from: 'ai' as const,
        created_at: {
          $date: new Date(createdAt.getTime() - 1000).toISOString()
        },
        created_by: 'lumos-system',
        processing_time: 50 + Math.random() * 200,
        confidence: 0.8 + Math.random() * 0.2,
        is_deleted: false
      };
      
      const humanVersion = {
        version_id: `v_human_${i}`,
        result: {
          answer: {
            content: isAutomated ? humanResponses[questionIndex] : `완전히 다른 답변: ${Math.random().toString(36).substring(7)}`
          },
          todos: []
        },
        generated_from: 'human' as const,
        created_at: {
          $date: createdAt.toISOString()
        },
        created_by: null,
        processing_time: null,
        confidence: null,
        is_deleted: false
      };
      
      const answer: Answer = {
        _id: `sample_${i}_${Date.now()}`,
        qid: `Q_${String(i).padStart(3, '0')}`,
        request: {
          messages: [
            {
              role: 'user',
              content: questions[questionIndex]
            }
          ],
          context: {
            additional_info: [],
            company_name: companies[companyIndex],
            program: [programs[programIndex]]
          },
          program: programs[programIndex]
        },
        versions: [aiVersion, humanVersion],
        created_at: {
          $date: createdAt.toISOString()
        }
      };
      
      sampleAnswers.push(answer);
    }
    
    // Insert sample data
    await collection.insertMany(sampleAnswers);
    console.log(`Inserted ${sampleAnswers.length} sample answers`);
    
    // Create indexes for better performance
    await collection.createIndex({ 'created_at.$date': 1 });
    await collection.createIndex({ qid: 1 });
    await collection.createIndex({ 'versions.generated_from': 1 });
    
    console.log('Created database indexes');
    
    // Display summary
    const stats = await collection.estimatedDocumentCount();
    console.log(`\\nDatabase setup complete!`);
    console.log(`Total documents: ${stats}`);
    console.log(`Database: ${DB_NAME}`);
    console.log(`Collection: answers`);
    
  } catch (error) {
    console.error('Error setting up sample data:', error);
  } finally {
    await client.close();
  }
}

// Run the setup
if (require.main === module) {
  createSampleData().catch(console.error);
}

export { createSampleData };