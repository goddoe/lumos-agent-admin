'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AutomationRate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfWeek, endOfWeek, parse } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState } from 'react';

interface AutomationChartProps {
  data: AutomationRate[];
  title: string;
  threshold?: number;
  onThresholdChange?: (threshold: number) => void;
}

export function AutomationChart({ data, title, threshold = 0.5, onThresholdChange }: AutomationChartProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState(threshold.toString());
  
  const predefinedThresholds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  
  const handleSelectChange = (value: string) => {
    if (value === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      const numValue = parseFloat(value);
      onThresholdChange?.(numValue);
    }
  };

  const handleCustomInputChange = (value: string) => {
    setCustomValue(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 0.9) {
      onThresholdChange?.(numValue);
    }
  };

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
      rate: item.automation_rate
    };
  });

  return (
    <Card className="border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center space-x-2">
            <Label className="text-sm font-medium">
              임계값:
            </Label>
            <Select
              value={isCustom ? 'custom' : threshold.toString()}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className="w-24 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {predefinedThresholds.map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {isCustom && (
              <Input
                type="number"
                min="0.1"
                max="0.9"
                step="0.01"
                value={customValue}
                onChange={(e) => handleCustomInputChange(e.target.value)}
                className="w-20 h-8 text-sm"
                placeholder="0.5"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: '자동화 비율 (%)', angle: -90, position: 'insideLeft' }}
                stroke="hsl(var(--border))"
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'rate') return [`${value.toFixed(1)}%`, '자동화 비율'];
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
                  if (value === 'rate') return '자동화 비율';
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
                dataKey="rate" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2.5}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                name="rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
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