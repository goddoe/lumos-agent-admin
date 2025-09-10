'use client';

import { Button } from '@/components/ui/button';

interface PeriodSelectorProps {
  selectedPeriod: 'week' | 'month' | 'year';
  onPeriodChange: (period: 'week' | 'month' | 'year') => void;
}

export function PeriodSelector({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) {
  const periods = [
    { value: 'week', label: '일별' },
    { value: 'month', label: '주별' },
    { value: 'year', label: '월별' }
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