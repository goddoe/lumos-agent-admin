'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, MessageSquare, CheckCircle, Bot, User } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { AutomationChart } from '@/components/AutomationChart';
import { AnswerCountChart } from '@/components/AnswerCountChart';
import { PeriodSelector } from '@/components/PeriodSelector';
import { ThresholdComparison } from '@/components/ThresholdComparison';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats, AutomationRate } from '@/lib/types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [filteredData, setFilteredData] = useState<AutomationRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreshold, setSelectedThreshold] = useState<number>(0.5);
  const [chartThreshold, setChartThreshold] = useState<number>(0.5);

  // Fetch dashboard stats for chart
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/automation-rates?threshold=${chartThreshold}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [chartThreshold]);

  // Update filtered data when period changes
  useEffect(() => {
    if (!stats) return;

    switch (selectedPeriod) {
      case 'week':
        setFilteredData(stats.daily_rates);
        break;
      case 'month':
        setFilteredData(stats.weekly_rates);
        break;
      case 'year':
        setFilteredData(stats.monthly_rates);
        break;
    }
  }, [stats, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-destructive">오류가 발생했습니다: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-yellow-800">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">자동화 대시보드</h1>
        <p className="text-muted-foreground">
          Lumos Agent의 자동화 성능을 실시간으로 모니터링합니다
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="전체 질문 수"
          value={stats.total_questions.toLocaleString()}
          icon={MessageSquare}
          subtitle="누적 총 질문"
        />
        <StatCard
          title="분석 데이터"
          value={`${stats.daily_rates.length}일`}
          icon={BarChart3}
          subtitle="최근 분석 기간"
        />
        <StatCard
          title="AI 답변수"
          value={stats.ai_answers_count.toLocaleString()}
          icon={Bot}
          subtitle="AI 버전이 있는 질문"
        />
        <StatCard
          title="User 답변수"
          value={stats.human_answers_count.toLocaleString()}
          icon={User}
          subtitle="사람 버전이 있는 질문"
        />
        <StatCard
          title="자동화된 답변"
          value={stats.automated_questions.toLocaleString()}
          icon={CheckCircle}
          subtitle="AI 도움을 받은 답변"
        />
        <StatCard
          title="전체 자동화율"
          value={`${stats.overall_automation_rate.toFixed(1)}%`}
          icon={TrendingUp}
          subtitle="누적 자동화 비율"
        />
      </div>

      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">시간대별 자동화 트렌드</h2>
        <PeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AutomationChart
            data={filteredData}
            title={`${selectedPeriod === 'week' ? '일별' : selectedPeriod === 'month' ? '주별' : '월별'} 자동화율`}
            threshold={chartThreshold}
            onThresholdChange={setChartThreshold}
          />
          
          <AnswerCountChart
            data={filteredData}
            title={`${selectedPeriod === 'week' ? '일별' : selectedPeriod === 'month' ? '주별' : '월별'} 답변 수`}
          />
        </div>
        
        <ThresholdComparison 
          data={stats.threshold_comparison}
          currentThreshold={chartThreshold}
          aiAnswersCount={stats.ai_answers_count}
          humanAnswersCount={stats.human_answers_count}
        />
      </div>

      {/* Performance Summary */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">기간별 성능 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">시간별 평균</p>
              <p className="text-2xl font-bold">
                {stats.hourly_rates.length > 0
                  ? (stats.hourly_rates.reduce((sum, item) => sum + item.automation_rate, 0) / stats.hourly_rates.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">일별 평균</p>
              <p className="text-2xl font-bold">
                {stats.daily_rates.length > 0
                  ? (stats.daily_rates.reduce((sum, item) => sum + item.automation_rate, 0) / stats.daily_rates.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">주별 평균</p>
              <p className="text-2xl font-bold">
                {stats.weekly_rates.length > 0
                  ? (stats.weekly_rates.reduce((sum, item) => sum + item.automation_rate, 0) / stats.weekly_rates.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary">월별 평균</p>
              <p className="text-2xl font-bold text-primary">
                {stats.monthly_rates.length > 0
                  ? (stats.monthly_rates.reduce((sum, item) => sum + item.automation_rate, 0) / stats.monthly_rates.length).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-primary">자동화 측정 방법</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI가 생성한 답변과 인간이 검토한 답변의 유사도를 <strong>Levenshtein distance</strong>로 측정합니다. 
            현재 <strong>{Math.round(selectedThreshold * 100)}% 이상</strong> 유사한 경우를 자동화된 답변으로 분류하며, 위의 임계값 비교에서 다른 기준점을 선택할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}