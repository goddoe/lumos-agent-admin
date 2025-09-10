'use client';

import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AutomationRate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AnswerCountChartProps {
  data: AutomationRate[];
  title: string;
}

export function AnswerCountChart({ data, title }: AnswerCountChartProps) {
  const chartData = data.map(item => {
    let displayPeriod = item.period;
    
    // Check if this is weekly data and format accordingly
    if (title.includes('주별') && item.period.includes('~')) {
      try {
        // Parse the period format like "2025-08-18~2025-08-24"
        const [startDateStr, endDateStr] = item.period.split('~');
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        
        // Format as "2025년 8월 18일~24일"
        const startFormatted = format(startDate, 'yyyy년 MM월 dd일', { locale: ko });
        const endFormatted = format(endDate, 'dd일', { locale: ko });
        displayPeriod = `${startFormatted}~${endFormatted}`;
      } catch (error) {
        // If parsing fails, keep original format
        displayPeriod = item.period;
      }
    }
    
    return {
      period: displayPeriod,
      originalPeriod: item.period,
      ai_count: item.ai_answers_count,
      human_count: item.human_answers_count
    };
  });

  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                angle={-45}
                textAnchor="end"
                height={100}
                stroke="hsl(var(--border))"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: '답변 수', angle: -90, position: 'insideLeft' }}
                stroke="hsl(var(--border))"
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'ai_count') return [`${value}개`, 'AI 답변'];
                  if (name === 'human_count') return [`${value}개`, 'User 답변'];
                  return [value, name];
                }}
                labelFormatter={(label) => `기간: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--card-foreground))'
                }}
              />
              <Legend 
                formatter={(value, entry) => {
                  if (value === 'ai_count') return 'AI 답변';
                  if (value === 'human_count') return 'User 답변';
                  return value;
                }}
                wrapperStyle={{ 
                  color: 'hsl(var(--foreground))',
                  paddingTop: '20px'
                }}
                verticalAlign="bottom"
                align="center"
              />
              <Line 
                type="monotone" 
                dataKey="ai_count" 
                stroke="#2563eb" 
                strokeWidth={2.5}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#2563eb' }}
                name="ai_count"
              />
              <Line 
                type="monotone" 
                dataKey="human_count" 
                stroke="#16a34a" 
                strokeWidth={2.5}
                dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#16a34a' }}
                name="human_count"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">총 AI 답변수</p>
            <p className="text-2xl font-bold">
              {data.reduce((sum, item) => sum + item.ai_answers_count, 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">총 User 답변수</p>
            <p className="text-2xl font-bold">
              {data.reduce((sum, item) => sum + item.human_answers_count, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}