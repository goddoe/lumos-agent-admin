'use client';

import { useState, useEffect } from 'react';
import { Filter, Eye, Calendar, Bot, User, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { ResponseDetail } from '@/components/ResponseDetail';
import { getSimilarityScore } from '@/lib/text-similarity';
import { Answer } from '@/lib/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ResponsesPageData {
  answers: Answer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ResponsesPage() {
  const [data, setData] = useState<ResponsesPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  // New filter states
  const [similarityThreshold, setSimilarityThreshold] = useState<number[]>([0.7]);
  const [filterHumanExists, setFilterHumanExists] = useState(false);
  const [filterAutomatedOnly, setFilterAutomatedOnly] = useState(false);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        
        // If filters are active, fetch all data for client-side filtering
        const shouldFetchAll = filterHumanExists || filterAutomatedOnly;
        
        const params = new URLSearchParams({
          page: shouldFetchAll ? '1' : currentPage.toString(),
          limit: shouldFetchAll ? '1000' : '10', // Fetch more data when filtering
          human_exists: filterHumanExists.toString()
        });
        
        const response = await fetch(`/api/responses?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch responses');
        }
        const responseData = await response.json();
        setData(responseData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [currentPage, filterHumanExists, filterAutomatedOnly, similarityThreshold]);

  // Debug: Log automation stats when data changes
  useEffect(() => {
    if (data) {
      const automatedCount = data.answers.filter(answer => isAutomated(answer)).length;
      const withBothVersions = data.answers.filter(answer => {
        const { ai, human } = getLatestVersions(answer);
        return ai && human;
      }).length;
      console.log(`Automation stats: ${automatedCount} automated out of ${withBothVersions} with both versions (total: ${data.answers.length})`);
    }
  }, [data, similarityThreshold]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterHumanExists, filterAutomatedOnly]);

  const getQuestionText = (answer: Answer): string => {
    const firstMessage = answer.request.messages.find(msg => msg.role === 'user');
    return firstMessage?.content || '질문 내용을 찾을 수 없습니다';
  };

  const getLatestVersions = (answer: Answer) => {
    console.log('All versions for', answer.qid, ':', answer.versions.map(v => ({ 
      generated_from: v.generated_from, 
      is_deleted: v.is_deleted 
    })));
    
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

    console.log('Filtered versions:', { 
      ai: aiVersions.length, 
      human: humanVersions.length 
    });

    return {
      ai: aiVersions[0],
      human: humanVersions[0]
    };
  };

  const isAutomated = (answer: Answer): boolean => {
    const { ai, human } = getLatestVersions(answer);
    if (!ai || !human) {
      console.log('Missing AI or Human version:', { ai: !!ai, human: !!human, qid: answer.qid });
      return false;
    }
    
    const similarity = getSimilarityScore(ai.result.answer.content, human.result.answer.content);
    const automated = similarity >= similarityThreshold[0];
    console.log('Automation check:', { 
      qid: answer.qid, 
      similarity, 
      threshold: similarityThreshold[0], 
      automated 
    });
    return automated;
  };
  
  const getSimilarity = (answer: Answer): number => {
    const { ai, human } = getLatestVersions(answer);
    if (!ai || !human) return 0;
    
    return getSimilarityScore(ai.result.answer.content, human.result.answer.content);
  };

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

  if (!data) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-yellow-800">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">응답 브라우징</h1>
        <p className="text-muted-foreground">
          AI 생성 응답과 인간 작성 응답을 비교하고 검토할 수 있습니다
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Similarity Threshold */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">유사도 임계값</label>
                <span className="text-sm text-muted-foreground">{Math.round(similarityThreshold[0] * 100)}%</span>
              </div>
              <Slider
                value={similarityThreshold}
                onValueChange={setSimilarityThreshold}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                이 값 이상의 유사도를 가진 응답을 "자동화됨"으로 분류합니다
              </p>
            </div>
            
            {/* Existence Filters */}
            <div className="space-y-3">
              <label className="text-sm font-medium">응답 필터</label>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="human-exists"
                    checked={filterHumanExists}
                    onCheckedChange={setFilterHumanExists}
                  />
                  <label htmlFor="human-exists" className="text-sm flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Human 응답이 있는 경우만
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="automated-only"
                    checked={filterAutomatedOnly}
                    onCheckedChange={setFilterAutomatedOnly}
                  />
                  <label htmlFor="automated-only" className="text-sm flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    자동화된 응답만
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {(() => {
        const filteredAnswers = data.answers.filter((answer) => {
          // Apply human exists filter if enabled
          if (filterHumanExists) {
            const { human } = getLatestVersions(answer);
            if (!human) return false;
          }
          
          // Apply automated-only filter if enabled
          if (filterAutomatedOnly) {
            const automated = isAutomated(answer);
            console.log(`Filter check for ${answer.qid}: automated=${automated}, filterAutomatedOnly=${filterAutomatedOnly}`);
            if (!automated) return false;
          }
          
          return true;
        });

        console.log(`Total answers: ${data.answers.length}, Filtered: ${filteredAnswers.length}, AutomatedFilter: ${filterAutomatedOnly}`);
        
        return (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {(filterHumanExists || filterAutomatedOnly) ? (
                <>필터된 {filteredAnswers.length}개의 응답 (전체 {data.total}개 중)</>
              ) : (
                <>총 {data.total}개의 응답 (페이지 {data.page} / {data.totalPages})</>
              )}
            </p>
          </div>
        );
      })()}

      {/* Response List */}
      <div className="space-y-4">
        {data.answers
          .filter((answer) => {
            // Apply human exists filter if enabled
            if (filterHumanExists) {
              const { human } = getLatestVersions(answer);
              if (!human) return false;
            }
            
            // Apply automated-only filter if enabled
            if (filterAutomatedOnly) {
              const automated = isAutomated(answer);
              if (!automated) return false;
            }
            
            return true;
          })
          .map((answer) => {
          const questionText = getQuestionText(answer);
          const { ai, human } = getLatestVersions(answer);
          const automated = isAutomated(answer);
          const similarity = getSimilarity(answer);
          
          return (
            <Card key={answer._id} className="border-border/40">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {/* AI Response Tag */}
                      {ai && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                          <Bot className="h-3 w-3 mr-1" />
                          AI 응답
                        </span>
                      )}
                      
                      {/* Human Response Tag */}
                      {human && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                          <User className="h-3 w-3 mr-1" />
                          Human 응답
                        </span>
                      )}
                      
                      {/* Automation Tag */}
                      {automated && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800">
                          자동화됨
                        </span>
                      )}
                      
                      {/* Similarity Score */}
                      {ai && human && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                          유사도 {Math.round(similarity * 100)}%
                        </span>
                      )}
                      
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(typeof answer.created_at === 'object' && '$date' in answer.created_at ? answer.created_at.$date : answer.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                      </span>
                    </div>
                    <h3 className="font-medium text-foreground mb-2 line-clamp-2">
                      {questionText}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>총 버전: {answer.versions.length}개</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-4"
                    onClick={() => {
                      setSelectedAnswer(answer);
                      setDetailOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    상세보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination - Hide when filters are active */}
      {data.totalPages > 1 && !filterHumanExists && !filterAutomatedOnly && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= data.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            다음
          </Button>
        </div>
      )}
      
      {/* Filter active message */}
      {(filterHumanExists || filterAutomatedOnly) && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            필터가 활성화되어 있어 모든 결과를 한 페이지에 표시합니다
          </p>
        </div>
      )}

      {/* Response Detail Modal */}
      <ResponseDetail
        answer={selectedAnswer}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}