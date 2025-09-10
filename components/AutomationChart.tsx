'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AutomationRate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AutomationChartProps {
  data: AutomationRate[];
  title: string;
}

export function AutomationChart({ data, title }: AutomationChartProps) {
  const chartData = data.map(item => ({
    period: item.period,
    rate: item.automation_rate,
    total: item.total_questions,
    automated: item.automated_questions
  }));

  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                angle={-45}
                textAnchor="end"
                height={60}
                stroke="hsl(var(--border))"
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: '자동화 비율 (%)', angle: -90, position: 'insideLeft' }}
                stroke="hsl(var(--border))"
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, '자동화 비율']}
                labelFormatter={(label) => `기간: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--card-foreground))'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">평균 자동화율</p>
            <p className="text-2xl font-bold">
              {data.length > 0 
                ? (data.reduce((sum, item) => sum + item.automation_rate, 0) / data.length).toFixed(1)
                : 0}%
            </p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">총 질문</p>
            <p className="text-2xl font-bold">
              {data.reduce((sum, item) => sum + item.total_questions, 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">자동화된 답변</p>
            <p className="text-2xl font-bold">
              {data.reduce((sum, item) => sum + item.automated_questions, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}