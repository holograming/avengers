# Tossplace 클론 - Avengers 워크플로우 실행 계획

## 전체 일정 (Infinity War Policy: 끝날 때까지 끝나지 않음)

### Phase 1: 프로젝트 기초 구축 (병렬, 독립적)

**병렬 Worktree 실행**:
```
시작 → T001 & T002 & T003 병렬
↓
모두 완료 → 각각 리뷰 & 병합
↓
Phase 2로 진행
```

**Task T001 (IronMan)** - Desktop QML 기초
```
worktree/ironman-T001
- CMakeLists.txt
- main.cpp
- QML 프로젝트 구조
- 토스 스타일 시스템
- 기본 MainPage.qml
```

**Task T002 (Natasha)** - Backend 핵심
```
worktree/natasha-T002
- C++ 프로젝트 구조
- 데이터 모델 (ProductModel.h, OrderModel.h, etc.)
- SQLite Database.h
- 기본 서비스 클래스
```

**Task T003 (IronMan)** - Web React 기초
```
worktree/ironman-T003
- package.json
- React 프로젝트 구조
- 라우팅 설정
- 토스 스타일
- 기본 MainPage.tsx
```

### Phase 2: 핵심 기능 구현 (병렬, 의존성 있음)

**의존성**: T001, T002, T003 완료 후 시작

**Task T004 (Natasha)** - 주문/결제 로직
```
worktree/natasha-T004
의존성: T002 완료
- OrderService 구현
- PaymentService 구현
- DB 스키마 업데이트
```

**Task T005 (IronMan)** - Desktop UI
```
worktree/ironman-T005
의존성: T001, T004 완료
- OrderPage.qml
- PaymentPage.qml
- ProductCard.qml
```

**Task T006 (IronMan)** - Web UI
```
worktree/ironman-T006
의존성: T003, T004 완료
- OrderPage.tsx
- PaymentPage.tsx
- ProductCard.tsx
```

### Phase 3: 확장 기능 (병렬)

**Task T007 (Natasha)** - 확장 기능 로직

**Task T008 (IronMan)** - Desktop 확장 UI

**Task T009 (IronMan)** - Web 확장 UI

### Phase 4: 테스트 & 최적화 (순차)

**Task T010 (Groot)** - Desktop 테스트

**Task T011 (Groot)** - Web 테스트

**Task T012 (전체)** - 성능 최적화

## Avengers MCP 도구 활용

### 1. 요청 분석 (Captain)
```typescript
avengers_analyze_request({
  request: "Tossplace 클론코딩 (Qt/QML + React + C++)",
  completionLevel: "with_execution"  // 실행 확인까지 필요
})
```

### 2. 작업 분배
```typescript
// Phase 1 작업 할당
avengers_assign_task({
  title: "Desktop QML 기초 구축",
  assignee: "ironman"
})  // T001

avengers_assign_task({
  title: "Backend 핵심 로직",
  assignee: "natasha"
})  // T002

avengers_assign_task({
  title: "Web React 기초 구축",
  assignee: "ironman",
  dependencies: ["T001"]  // 스타일 공유
})  // T003
```

### 3. 병렬 에이전트 실행
```typescript
// Worktree 기반 병렬 작업
avengers_dispatch_agent({
  agent: "ironman",
  task: "Desktop QML 기초 구축",
  worktree: true,  // worktree/ironman-T001 생성
  mode: "background"
})

avengers_dispatch_agent({
  agent: "natasha",
  task: "Backend 핵심 로직",
  worktree: true,  // worktree/natasha-T002 생성
  mode: "background"
})

avengers_dispatch_agent({
  agent: "ironman",
  task: "Web React 기초 구축",
  worktree: true,  // worktree/ironman-T003 생성
  mode: "background"
})
```

### 4. 결과 수집 및 검증
```typescript
// Phase 1 완료 후 결과 수집
avengers_collect_results({
  taskIds: ["T001", "T002", "T003"],
  timeout: 300000,  // 5분 대기
  format: "detailed"
})

// 각 Task 검증
avengers_validate_completion({
  taskId: "T001",
  testResults: { compile: true, uiRender: true },
  strictness: "moderate"
})
```

### 5. 코드 리뷰 (필수)
```typescript
// T001 리뷰
avengers_skill_code_review({
  phase: "request",
  files: ["desktop/src/ui/pages/MainPage.qml", "desktop/CMakeLists.txt"],
  taskId: "T001"
})

// Groot이 리뷰
avengers_skill_code_review({
  phase: "review",
  files: ["..."]
})

// 승인
avengers_skill_code_review({
  phase: "approve",
  taskId: "T001"
})
```

### 6. Worktree 병합
```typescript
// T001 병합
avengers_merge_worktree({
  worktreePath: "worktree/ironman-T001",
  targetBranch: "test/moc-toss-place",
  createPR: false  // 직접 merge
})

// T002 병합
avengers_merge_worktree({
  worktreePath: "worktree/natasha-T002",
  targetBranch: "test/moc-toss-place",
  createPR: false
})
```

### 7. 컨텍스트 공유
```typescript
// Phase 1 결과 공유
avengers_update_shared_context({
  taskId: "phase1-complete",
  agent: "captain",
  files: ["desktop/CMakeLists.txt", "shared/schemas/database.sql"],
  summary: "Phase 1 완료: 기초 구조 및 공유 스키마 준비"
})

// Phase 2 참고
avengers_get_shared_context({
  taskId: "phase1-complete",
  filter: "database"
})
```

### 8. 상태 저장 및 세션 관리
```typescript
// 주기적 상태 저장
avengers_save_state({
  key: "tossplace-phase1",
  includeAgents: true,
  includeTasks: true
})

// 세션 요약
avengers_summarize_session({
  format: "markdown",
  includeMetrics: true
})
```

## 예상 타임라인

| Phase | Task | 예상 | 상태 |
|-------|------|------|------|
| 1 | T001-T003 | 2-3h (병렬) | 대기 |
| 2 | T004-T006 | 3-4h (병렬) | 대기 |
| 3 | T007-T009 | 2-3h (병렬) | 대기 |
| 4 | T010-T012 | 2-3h | 대기 |
| **총합** | | **4-5h (병렬 최적)** | |

## 성공 기준 (Infinity War Policy)

✅ 모든 테스트 통과
✅ Desktop: 컴파일 + 실행 확인
✅ Web: npm run dev + 브라우저 확인
✅ 기본 워크플로우: 주문 → 결제 동작 확인
✅ 모든 커밋 완료 및 git push

---

*작성: 2025-01-13 16:45 Captain*
*상태: Avengers 시스템 기반 Phase 1 시작 준비 완료*
