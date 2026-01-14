# Tossplace 클론 프로젝트 - 부트스트랩 계획

**프로젝트**: Tossplace 클론 (Qt/QML 데스크톱)
**작업 범위**: 사용자 인증 + 상품 조회
**데이터베이스**: SQLite

---

## Phase 1: ✅ 프로젝트 초기화 (완료)

### 1.1 디렉토리 구조 생성
- [x] 전체 디렉토리 구조 생성
- [x] CMakeLists.txt 생성
- [x] tests/CMakeLists.txt 생성

### 1.2 데이터베이스 스키마
- [x] database.sql 작성
  - users 테이블
  - products 테이블
  - product_reviews 테이블
  - 인덱스 생성

### 1.3 코어 클래스 정의
- [x] Database 클래스 (database.h, database.cpp)
- [x] User 모델 (user.h)
- [x] Product 모델 (product.h, product.cpp)
- [x] AuthService (authservice.h, authservice.cpp)
- [x] ProductService (productservice.h, productservice.cpp)

### 1.4 Application 클래스
- [x] Application 클래스 (application.h, application.cpp)
- [x] main.cpp

### 1.5 QML UI 작성
- [x] main.qml (메인 윈도우)
- [x] LoginScreen.qml (로그인 화면)
- [x] ProductListScreen.qml (상품 목록 화면)
- [x] ProductDetailScreen.qml (상품 상세 화면)

### 1.6 테스트 스텁 작성
- [x] test_database.cpp
- [x] test_auth.cpp
- [x] test_product.cpp

---

## Phase 2: 백엔드 구현 (예정)

### 2.1 Database 모듈 완성
**담당**: Natasha (Backend Developer)
**작업** (worktree: natasha-T001):
- [ ] Database::executeQuery() 구현
- [ ] Database::executeUpdate() 구현
- [ ] 트랜잭션 처리 추가
- [ ] 에러 로깅 시스템

**테스트**:
- [ ] test_database.cpp 완성 및 통과
- [ ] 커버리지 80% 이상

**완료 조건**:
- 모든 테스트 통과
- Database 클래스 완전 구현

---

### 2.2 AuthService 구현
**담당**: Natasha (Backend Developer)
**작업** (worktree: natasha-T002):
- [ ] registerUser() - 사용자 등록 구현
- [ ] loginUser() - 로그인 검증 구현
- [ ] JWT 토큰 생성 및 검증
- [ ] 비밀번호 해싱/검증

**테스트**:
- [ ] test_auth.cpp 완성 및 통과
- [ ] 50개 이상의 유효/무효 입력 테스트

**완료 조건**:
- 모든 테스트 통과
- 보안 요구사항 충족

---

### 2.3 ProductService 구현
**담당**: Natasha (Backend Developer)
**작업** (worktree: natasha-T003):
- [ ] getAllProducts() 구현
- [ ] getProductsByCategory() 구현
- [ ] searchProducts() 구현
- [ ] createProduct(), updateProduct(), deleteProduct() 구현
- [ ] 페이지네이션 처리

**테스트**:
- [ ] test_product.cpp 완성 및 통과
- [ ] 다양한 필터링 조건 테스트

**완료 조건**:
- 모든 테스트 통과
- 대량 데이터(1000+) 성능 테스트

---

## Phase 3: 프론트엔드 구현 (예정)

### 3.1 QML/C++ 통합
**담당**: IronMan (Full-Stack Developer)
**작업** (worktree: ironman-T004):
- [ ] LoginScreen과 AuthService 연결
- [ ] ProductListScreen과 ProductService 연결
- [ ] ProductDetailScreen 기능 구현
- [ ] 상태 관리 (로그인 상태 유지)

**완료 조건**:
- UI와 백엔드 완전 통합
- 모든 네비게이션 동작

---

### 3.2 UI 폴리시 및 테마
**담당**: IronMan (Full-Stack Developer)
**작업** (worktree: ironman-T005):
- [ ] Tossplace 색상 테마 적용
- [ ] 반응형 레이아웃
- [ ] 다크모드 지원 (선택)

**완료 조건**:
- 모든 화면에서 일관된 스타일
- 다양한 화면 크기에서 테스트

---

## Phase 4: 통합 테스트 (예정)

**담당**: Groot (QA/Testing Specialist)
**작업** (worktree: groot-T006):
- [ ] 엔드-투-엔드 테스트
- [ ] 회귀 테스트
- [ ] 성능 벤치마크
- [ ] 메모리 누수 검사

**완료 조건**:
- 전체 커버리지 80% 이상
- 모든 E2E 테스트 통과

---

## Phase 5: 문서화 (예정)

**담당**: Vision (Documentation Specialist)
**작업**:
- [ ] API 문서 생성
- [ ] 아키텍처 문서
- [ ] 설치 및 빌드 가이드
- [ ] 사용자 가이드

**완료 조건**:
- 완전한 문서화
- 코드 예제 포함

---

## 팀 역할 분담

| 에이전트 | 역할 | 담당 작업 |
|---------|------|----------|
| **Natasha** | 백엔드 개발자 | Database, Auth, Product 서비스 |
| **IronMan** | 풀스택 개발자 | QML/C++ 통합, UI/UX |
| **Groot** | QA/테스트 | 단위/통합 테스트, E2E 테스트 |
| **Vision** | 문서화 담당 | API 문서, 가이드 |
| **Captain** | 오케스트레이터 | 작업 조율, 병합 관리 |

---

## 워크플로우

### Worktree 기반 병렬 작업

```
main branch (초기화 완료)
├── worktree/natasha-T001 (Database 구현)
├── worktree/natasha-T002 (AuthService 구현)
├── worktree/natasha-T003 (ProductService 구현)
├── worktree/ironman-T004 (UI 통합)
└── worktree/ironman-T005 (UI 테마)
```

### 순서 및 의존성

1. **Natasha의 3개 작업은 병렬 진행 가능** (독립적)
2. **IronMan의 작업은 Natasha 완료 후 시작** (의존성: T001, T002, T003)
3. **Groot의 테스트는 모든 구현 완료 후 시작**
4. **Vision의 문서화는 최후에 진행**

---

## 체크리스트

### 즉시 할 일
- [ ] 팀 킥오프 미팅 (모든 에이전트)
- [ ] Natasha 디스패치: Task T001, T002, T003 시작
- [ ] IronMan 대기 (T001-T003 완료 후 T004, T005 시작)

### Phase 2 시작 신호
```typescript
avengers_dispatch_agent({
  agent: "natasha",
  task: "Database 모듈 완성",
  worktree: true,
  taskId: "T001"
})

avengers_dispatch_agent({
  agent: "natasha",
  task: "AuthService 구현",
  worktree: true,
  taskId: "T002"
})

avengers_dispatch_agent({
  agent: "natasha",
  task: "ProductService 구현",
  worktree: true,
  taskId: "T003"
})
```

---

## 성공 기준

- [x] Phase 1 완료: 프로젝트 부트스트랩
- [ ] Phase 2 완료: 백엔드 서비스 100% 구현
- [ ] Phase 3 완료: 프론트엔드 UI/로직 통합
- [ ] Phase 4 완료: 전체 테스트 커버리지 80% 이상
- [ ] Phase 5 완료: 완전한 문서화

---

## 예상 일정

| Phase | 예상 기간 | 상태 |
|-------|----------|------|
| Phase 1 | 1시간 | ✅ 완료 |
| Phase 2 | 3-4시간 | ⏳ 예정 |
| Phase 3 | 2-3시간 | ⏳ 예정 |
| Phase 4 | 1-2시간 | ⏳ 예정 |
| Phase 5 | 1시간 | ⏳ 예정 |
| **총계** | **8-11시간** | |

---

## 참고사항

- 모든 작업은 TDD 원칙 준수
- Worktree 격리로 병렬성 극대화
- 매 Phase 마다 에이전트 간 컨텍스트 공유
- 최종 병합 전 코드 리뷰 필수
