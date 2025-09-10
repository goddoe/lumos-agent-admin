# Lumos Agent Admin Dashboard

Lumos Agent의 자동화 비율을 시각화하고 모니터링하는 대시보드 애플리케이션입니다.

## 기능

- **실시간 자동화 비율 모니터링**: AI와 인간 답변의 유사도를 기반으로 자동화 비율 계산
- **시간대별 트렌드 분석**: 시간별, 일별, 주별, 월별 자동화 비율 추이
- **텍스트 유사도 분석**: Levenshtein distance와 단어 겹침 비율을 활용한 정확한 유사도 측정
- **직관적인 대시보드**: 차트와 통계 카드를 통한 데이터 시각화

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: MongoDB
- **Icons**: Lucide React

## 환경 설정

`.env` 파일에 MongoDB 연결 정보를 설정하세요:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password
MONGODB_DB_NAME=lumos_agent
```

## 개발 명령어

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 린트 검사
npm run lint

# 타입 체크
npm run type-check
```

## 데이터베이스 구조

애플리케이션은 MongoDB의 `answers` 컬렉션을 사용합니다. 각 문서는 다음 구조를 가집니다:

- 질문 ID와 요청 정보
- 여러 버전의 답변 (AI 생성 및 인간 검토)
- 각 버전의 생성 시간과 메타데이터

## 자동화 측정 알고리즘

1. 각 질문에 대해 최신 AI 버전과 인간 버전을 찾습니다
2. 두 답변의 텍스트 유사도를 계산합니다:
   - Levenshtein distance (60% 가중치)
   - 단어 겹침 비율 (40% 가중치)
3. 유사도가 70% 이상인 경우 자동화된 답변으로 분류합니다

## API 엔드포인트

- `GET /api/automation-rates` - 전체 대시보드 통계
- `GET /api/automation-rates?period=day&count=7` - 특정 기간 자동화 비율
- `GET /api/stats` - 기본 통계 정보

## 브라우저에서 확인

개발 서버를 실행한 후 [http://localhost:3000](http://localhost:3000)에서 대시보드를 확인할 수 있습니다.