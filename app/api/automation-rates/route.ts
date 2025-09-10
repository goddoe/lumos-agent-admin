import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats, getAutomationRatesForPeriod } from '@/lib/automation-calculator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'day' | 'week' | 'month' | null;
    const count = searchParams.get('count');
    const threshold = searchParams.get('threshold');
    const thresholdNum = threshold ? parseFloat(threshold) : 0.7;

    if (period && ['day', 'week', 'month'].includes(period)) {
      const countNum = count ? parseInt(count, 10) : 7;
      const rates = await getAutomationRatesForPeriod(period, countNum);
      return NextResponse.json({ rates });
    } else {
      const stats = await getDashboardStats(thresholdNum);
      
      // Debug logging
      console.log('Dashboard stats generated:', {
        total_questions: stats.total_questions,
        hourly_rates_count: stats.hourly_rates.length,
        daily_rates_count: stats.daily_rates.length,
        weekly_rates_count: stats.weekly_rates.length,
        monthly_rates_count: stats.monthly_rates.length,
        threshold: thresholdNum
      });
      
      return NextResponse.json(stats);
    }
  } catch (error) {
    console.error('Error fetching automation rates:', error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch automation rates',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}