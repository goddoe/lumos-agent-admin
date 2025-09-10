'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThresholdAutomationRate } from '@/lib/types';

interface ThresholdComparisonProps {
  data: ThresholdAutomationRate[];
  currentThreshold?: number;
  onThresholdChange?: (threshold: number) => void;
}

export function ThresholdComparison({ data, currentThreshold = 0.7, onThresholdChange }: ThresholdComparisonProps) {
  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">임계값별 자동화율 비교</CardTitle>
        <p className="text-sm text-muted-foreground">
          다양한 유사도 임계값에 따른 자동화 판단 결과 (클릭하여 선택)
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {data.map((item) => {
            const isCurrentThreshold = item.threshold === currentThreshold;
            
            return (
              <div
                key={item.threshold}
                onClick={() => onThresholdChange?.(item.threshold)}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                  isCurrentThreshold 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'bg-muted/30 hover:bg-muted/50 hover:border hover:border-muted-foreground/20'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center justify-center w-12 h-8 rounded text-xs font-medium ${
                    isCurrentThreshold 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {Math.round(item.threshold * 100)}%
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      isCurrentThreshold ? 'text-primary' : 'text-foreground'
                    }`}>
                      임계값 {item.threshold}
                      {isCurrentThreshold && <span className="ml-2 text-xs">(현재 적용)</span>}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    isCurrentThreshold ? 'text-primary' : 'text-foreground'
                  }`}>
                    {item.automation_rate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.automated_questions.toLocaleString()}개 자동화
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>해석:</strong> 임계값이 높을수록 더 엄격한 기준으로 자동화를 판단합니다. 
            낮은 임계값은 더 많은 답변을 자동화로 분류하지만 정확도가 떨어질 수 있습니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}