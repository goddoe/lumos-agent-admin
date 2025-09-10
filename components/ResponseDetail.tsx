'use client';

import { useState } from 'react';
import { Copy, Bot, User, Calendar, Clock, Gauge } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Answer, Version } from '@/lib/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getSimilarityScore } from '@/lib/text-similarity';

interface ResponseDetailProps {
  answer: Answer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getLatestVersions(answer: Answer) {
  const aiVersions = answer.versions
    .filter(v => v.generated_from === 'ai' && !v.is_deleted)
    .sort((a, b) => {
      const dateA = new Date(typeof a.created_at === 'object' && '$date' in a.created_at ? a.created_at.$date : a.created_at).getTime();
      const dateB = new Date(typeof b.created_at === 'object' && '$date' in b.created_at ? b.created_at.$date : b.created_at).getTime();
      return dateB - dateA;
    });
  
  const humanVersions = answer.versions
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

function VersionCard({ version, type }: { version: Version | undefined; type: 'ai' | 'human' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!version) return;
    await navigator.clipboard.writeText(version.result.answer.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!version) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            {type === 'ai' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            {type === 'ai' ? 'AI 생성 응답' : '인간 작성 응답'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">해당 타입의 응답이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            {type === 'ai' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            {type === 'ai' ? 'AI 생성 응답' : '인간 작성 응답'}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2"
          >
            <Copy className="h-3 w-3 mr-1" />
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(typeof version.created_at === 'object' && '$date' in version.created_at ? version.created_at.$date : version.created_at), 'MM월 dd일 HH:mm', { locale: ko })}
          </span>
          {version.processing_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {version.processing_time}ms
            </span>
          )}
          {version.confidence && (
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              신뢰도 {Math.round(version.confidence * 100)}%
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {version.result.answer.content}
          </div>
        </div>
        
        {/* Additional Information */}
        {(version.result.answer.evidences?.length || version.result.answer.forms?.length) && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">추가 정보</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              {version.result.answer.evidences?.length && (
                <p>증거자료: {version.result.answer.evidences.length}개</p>
              )}
              {version.result.answer.forms?.length && (
                <p>첨부 양식: {version.result.answer.forms.length}개</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ResponseDetail({ answer, open, onOpenChange }: ResponseDetailProps) {
  if (!answer) return null;

  const { ai, human } = getLatestVersions(answer);
  const questionText = answer.request.messages.find(msg => msg.role === 'user')?.content || '';
  
  // Calculate similarity if both versions exist
  const similarityScore = ai && human 
    ? getSimilarityScore(ai.result.answer.content, human.result.answer.content)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">응답 상세 비교</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Question */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">질문</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{questionText}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>질문 ID: {answer.qid}</span>
                <span>생성일: {format(new Date(typeof answer.created_at === 'object' && '$date' in answer.created_at ? answer.created_at.$date : answer.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}</span>
                <span>전체 버전: {answer.versions.length}개</span>
              </div>
            </CardContent>
          </Card>

          {/* Similarity Score */}
          {ai && human && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-primary">유사도 점수</h3>
                    <p className="text-xs text-muted-foreground">
                      Levenshtein 거리 기반 텍스트 유사도 측정
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(similarityScore * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {similarityScore >= 0.7 ? '자동화됨' : '수동'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response Comparison */}
          <div className="flex flex-col lg:flex-row gap-6">
            <VersionCard version={ai} type="ai" />
            <VersionCard version={human} type="human" />
          </div>

          {/* Context Information */}
          {answer.request.context && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">컨텍스트 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {answer.request.context.company_name && (
                    <div>
                      <span className="font-medium">기관명:</span>
                      <span className="ml-2">{answer.request.context.company_name}</span>
                    </div>
                  )}
                  {answer.request.context.program && (
                    <div>
                      <span className="font-medium">프로그램:</span>
                      <span className="ml-2">{Array.isArray(answer.request.context.program) 
                        ? answer.request.context.program.join(', ') 
                        : answer.request.context.program}</span>
                    </div>
                  )}
                  {answer.request.program && (
                    <div>
                      <span className="font-medium">요청 프로그램:</span>
                      <span className="ml-2">{answer.request.program}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}