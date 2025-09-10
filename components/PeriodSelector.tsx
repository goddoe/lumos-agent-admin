'use client';

import { Button } from '@/components/ui/button';

interface PeriodSelectorProps {
  selectedPeriod: 'day' | 'week' | 'month';
  onPeriodChange: (period: 'day' | 'week' | 'month') => void;
}

export function PeriodSelector({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) {
  const periods = [
    { value: 'day', label: '일별 (24시간)' },
    { value: 'week', label: '주별 (7일)' },
    { value: 'month', label: '월별 (6개월)' }
  ] as const;

  return (
    <div className="flex space-x-1 p-1 bg-muted rounded-lg">
      {periods.map((period) => (
        <Button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          variant={selectedPeriod === period.value ? 'default' : 'ghost'}
          size="sm"
          className="text-sm font-medium"
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}