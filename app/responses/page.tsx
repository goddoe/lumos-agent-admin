'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponseDetail } from '@/components/ResponseDetail';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<'all' | 'automated' | 'manual'>('all');
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          search: searchTerm,
          filter: filterStatus
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
  }, [currentPage, searchTerm, filterStatus]);

  const getQuestionText = (answer: Answer): string => {
    const firstMessage = answer.request.messages.find(msg => msg.role === 'user');
    return firstMessage?.content || '질문 내용을 찾을 수 없습니다';
  };

  const getLatestVersions = (answer: Answer) => {
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
  };

  const isAutomated = (answer: Answer): boolean => {
    const { ai, human } = getLatestVersions(answer);
    return !!(ai && human);
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

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="질문 내용으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'automated' | 'manual')}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="automated">자동화됨</SelectItem>
                  <SelectItem value="manual">수동</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 {data.total}개의 응답 (페이지 {data.page} / {data.totalPages})
        </p>
      </div>

      {/* Response List */}
      <div className="space-y-4">
        {data.answers.map((answer) => {
          const questionText = getQuestionText(answer);
          const { ai, human } = getLatestVersions(answer);
          const automated = isAutomated(answer);
          
          return (
            <Card key={answer._id} className="border-border/40">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        automated 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {automated ? '자동화됨' : '수동'}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(typeof answer.created_at === 'object' && '$date' in answer.created_at ? answer.created_at.$date : answer.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                      </span>
                    </div>
                    <h3 className="font-medium text-foreground mb-2 line-clamp-2">
                      {questionText}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>AI 버전: {ai ? '있음' : '없음'}</span>
                      <span>인간 버전: {human ? '있음' : '없음'}</span>
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

      {/* Pagination */}
      {data.totalPages > 1 && (
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

      {/* Response Detail Modal */}
      <ResponseDetail
        answer={selectedAnswer}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}