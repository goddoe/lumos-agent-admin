import { getDatabase } from './mongodb';
import { Answer, Version, AutomationRate, DashboardStats, ThresholdAutomationRate } from './types';
import { isAutomatedAnswer, getSimilarityScore } from './text-similarity';
import { 
  startOfHour, 
  startOfDay, 
  startOfWeek, 
  startOfMonth,
  endOfWeek,
  format,
  subHours,
  subDays,
  subWeeks,
  subMonths,
  getWeek,
  getYear
} from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * Get the latest version of each type (AI and human) for a question
 */
function getLatestVersions(versions: Version[]): { ai?: Version; human?: Version } {
  const aiVersions = versions
    .filter(v => v.generated_from === 'ai' && !v.is_deleted)
    .sort((a, b) => {
      const dateA = new Date(typeof a.created_at === 'object' && '$date' in a.created_at ? a.created_at.$date : a.created_at).getTime();
      const dateB = new Date(typeof b.created_at === 'object' && '$date' in b.created_at ? b.created_at.$date : b.created_at).getTime();
      return dateB - dateA;
    });
  
  const humanVersions = versions
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

/**
 * Check if a question is automated based on AI and human version similarity
 */
function isQuestionAutomated(answer: Answer, threshold: number = 0.7): boolean {
  const { ai, human } = getLatestVersions(answer.versions);
  
  if (!ai || !human) {
    return false;
  }

  const aiContent = ai.result.answer.content;
  const humanContent = human.result.answer.content;

  return isAutomatedAnswer(aiContent, humanContent, threshold);
}

/**
 * Get similarity score for a question
 */
function getQuestionSimilarityScore(answer: Answer): number {
  const { ai, human } = getLatestVersions(answer.versions);
  
  if (!ai || !human) {
    return 0;
  }

  const aiContent = ai.result.answer.content;
  const humanContent = human.result.answer.content;

  return getSimilarityScore(aiContent, humanContent);
}

/**
 * Calculate automation rates for multiple thresholds
 */
export async function calculateThresholdComparison(): Promise<ThresholdAutomationRate[]> {
  const db = await getDatabase();
  const collection = db.collection<Answer>('answers');
  
  const answers = await collection.find({}).toArray();
  const thresholds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  
  return thresholds.map(threshold => {
    const automatedQuestions = answers.filter(answer => isQuestionAutomated(answer, threshold)).length;
    const automationRate = answers.length > 0 ? (automatedQuestions / answers.length) * 100 : 0;
    
    return {
      threshold,
      automated_questions: automatedQuestions,
      automation_rate: automationRate
    };
  });
}

/**
 * Calculate automation rates for a specific time period
 */
export async function calculateAutomationRates(
  startDate: Date,
  endDate: Date,
  groupBy: 'hour' | 'day' | 'week' | 'month',
  threshold: number = 0.7
): Promise<AutomationRate[]> {
  const db = await getDatabase();
  const collection = db.collection<Answer>('answers');

  // Get all answers in the time range - use Date objects for comparison
  const answers = await collection.find({
    'created_at': {
      $gte: startDate,
      $lte: endDate
    }
  }).toArray();
  
  console.log(`Found ${answers.length} answers in date range ${startDate.toISOString()} to ${endDate.toISOString()}`);

  // Group answers by time period
  const groupedAnswers = new Map<string, Answer[]>();

  answers.forEach(answer => {
    // Handle both date formats
    const dateStr = typeof answer.created_at === 'object' && '$date' in answer.created_at 
      ? answer.created_at.$date 
      : answer.created_at;
    const date = new Date(dateStr);
    let periodStart: Date;
    let periodKey: string;

    switch (groupBy) {
      case 'hour':
        periodStart = startOfHour(date);
        periodKey = format(periodStart, 'MM월 dd일 HH시', { locale: ko });
        break;
      case 'day':
        periodStart = startOfDay(date);
        periodKey = format(periodStart, 'MM월 dd일', { locale: ko });
        break;
      case 'week':
        periodStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
        const periodEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday end
        const startFormatted = format(periodStart, 'yyyy년 MM월 dd일', { locale: ko });
        const endFormatted = format(periodEnd, 'dd일', { locale: ko });
        periodKey = `${startFormatted}~${endFormatted}`;
        break;
      case 'month':
        periodStart = startOfMonth(date);
        periodKey = format(periodStart, 'yyyy년 MM월', { locale: ko });
        break;
      default:
        throw new Error('Invalid groupBy parameter');
    }

    if (!groupedAnswers.has(periodKey)) {
      groupedAnswers.set(periodKey, []);
    }
    groupedAnswers.get(periodKey)!.push(answer);
  });

  // Calculate automation rates for each period
  const rates: AutomationRate[] = [];

  groupedAnswers.forEach((answers, periodKey) => {
    const totalQuestions = answers.length;
    const automatedQuestions = answers.filter(answer => isQuestionAutomated(answer, threshold)).length;
    const automationRate = totalQuestions > 0 ? (automatedQuestions / totalQuestions) * 100 : 0;
    
    // Count questions with AI answers (not version count, but question count)
    const aiAnswersCount = answers.filter(answer => 
      answer.versions.some(v => v.generated_from === 'ai' && !v.is_deleted)
    ).length;
    
    // Count questions with Human answers (not version count, but question count)  
    const humanAnswersCount = answers.filter(answer => 
      answer.versions.some(v => v.generated_from === 'human' && !v.is_deleted)
    ).length;

    rates.push({
      period: periodKey,
      total_questions: totalQuestions,
      automated_questions: automatedQuestions,
      automation_rate: automationRate,
      ai_answers_count: aiAnswersCount,
      human_answers_count: humanAnswersCount,
      timestamp: new Date(periodKey)
    });
  });

  return rates.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Get comprehensive dashboard statistics
 */
export async function getDashboardStats(threshold: number = 0.7): Promise<DashboardStats> {
  const now = new Date();
  
  // Calculate different time periods - get last 6 months of data to show proper monthly/weekly breakdown
  const sixMonthsAgo = subMonths(now, 6);
  
  // Use actual data date range: 2025-07-22 to 2025-09-10
  const dataStartDate = new Date('2025-07-22T00:00:00.000Z');
  const dataEndDate = new Date('2025-09-10T23:59:59.999Z');
  
  const [hourlyRates, dailyRates, weeklyRates, monthlyRates, thresholdComparison] = await Promise.all([
    calculateAutomationRates(dataStartDate, dataEndDate, 'hour', threshold),   // Use actual data range
    calculateAutomationRates(dataStartDate, dataEndDate, 'day', threshold),    // Use actual data range
    calculateAutomationRates(dataStartDate, dataEndDate, 'week', threshold),   // Use actual data range
    calculateAutomationRates(dataStartDate, dataEndDate, 'month', threshold),  // Use actual data range
    calculateThresholdComparison()
  ]);

  // Calculate overall statistics
  const db = await getDatabase();
  const collection = db.collection<Answer>('answers');
  
  const allAnswers = await collection.find({}).toArray();
  const totalQuestions = allAnswers.length;
  const automatedQuestions = allAnswers.filter(answer => isQuestionAutomated(answer, threshold)).length;
  const overallAutomationRate = totalQuestions > 0 ? (automatedQuestions / totalQuestions) * 100 : 0;
  
  // Count overall AI and Human answers (questions with those answer types)
  const aiAnswersCount = allAnswers.filter(answer => 
    answer.versions.some(v => v.generated_from === 'ai' && !v.is_deleted)
  ).length;
  
  const humanAnswersCount = allAnswers.filter(answer => 
    answer.versions.some(v => v.generated_from === 'human' && !v.is_deleted)
  ).length;

  return {
    total_questions: totalQuestions,
    automated_questions: automatedQuestions,
    overall_automation_rate: overallAutomationRate,
    ai_answers_count: aiAnswersCount,
    human_answers_count: humanAnswersCount,
    threshold_comparison: thresholdComparison,
    hourly_rates: hourlyRates,
    daily_rates: dailyRates,
    weekly_rates: weeklyRates,
    monthly_rates: monthlyRates
  };
}

/**
 * Get automation rates for a specific time period and granularity
 */
export async function getAutomationRatesForPeriod(
  period: 'day' | 'week' | 'month',
  count: number = 7
): Promise<AutomationRate[]> {
  const now = new Date();
  let startDate: Date;
  let groupBy: 'hour' | 'day' | 'week' | 'month';

  switch (period) {
    case 'day':
      startDate = subDays(now, count);
      groupBy = 'hour';
      break;
    case 'week':
      startDate = subWeeks(now, count);
      groupBy = 'day';
      break;
    case 'month':
      startDate = subMonths(now, count);
      groupBy = 'week';
      break;
    default:
      throw new Error('Invalid period parameter');
  }

  return calculateAutomationRates(startDate, now, groupBy);
}