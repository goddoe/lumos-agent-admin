'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ThresholdAutomationRate } from '@/lib/types';

interface ThresholdComparisonProps {
  data: ThresholdAutomationRate[];
  currentThreshold?: number;
  aiAnswersCount?: number;
  humanAnswersCount?: number;
}

export function ThresholdComparison({ data, currentThreshold = 0.5, aiAnswersCount, humanAnswersCount }: ThresholdComparisonProps) {
  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">임계값별 자동화율 비교</CardTitle>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            다양한 유사도 임계값에 따른 자동화 판단 결과
          </p>
          {(aiAnswersCount !== undefined || humanAnswersCount !== undefined) && (
            <div className="flex items-center space-x-4 text-sm">
              {aiAnswersCount !== undefined && (
                <span>
                  <strong className="font-semibold">AI 답변수:</strong> {aiAnswersCount.toLocaleString()}개
                </span>
              )}
              {humanAnswersCount !== undefined && (
                <span>
                  <strong className="font-semibold">User 답변수:</strong> {humanAnswersCount.toLocaleString()}개
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">임계값</TableHead>
              <TableHead className="text-right">자동화율</TableHead>
              <TableHead className="text-right">자동화 답변 수</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              const isCurrentThreshold = item.threshold === currentThreshold;
              
              return (
                <TableRow key={item.threshold} className={isCurrentThreshold ? 'bg-primary/5' : ''}>
                  <TableCell>
                    <div className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium ${
                      isCurrentThreshold 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {item.threshold}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {item.automation_rate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {item.automated_questions.toLocaleString()}개
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
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