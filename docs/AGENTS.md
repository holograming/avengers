# Avengers Agents

7명의 전문 AI 에이전트가 협력하여 개발 작업을 수행합니다.

## Agent Hierarchy

```
              ┌─────────────────────┐
              │      Captain        │  ← Orchestrator & Coordinator
              │  요청 분석 + 조율    │
              └──────────┬──────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───▼────┐          ┌────▼────┐          ┌────▼───┐
│ Jarvis │          │Dr.Strange│          │ Vision │
│Research│          │ Planning │          │  Docs  │
└────────┘          └──────────┘          └────────┘
         Advisory Layer (동등 레벨)
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───▼────┐          ┌────▼────┐          ┌────▼───┐
│IronMan │          │ Natasha │          │ Groot  │
│Fullstk │          │ Backend │          │  Test  │
└────────┘          └──────────┘          └────────┘
         Execution Layer
```

## Agent Details

### Captain (Orchestrator)

| 속성 | 값 |
|------|-----|
| **역할** | 작업 분석, 할당, 조율 |
| **권한** | read-only |
| **주요 기능** | 요청 유형 분석, 워크플로우 선택, 에이전트 디스패치 |

**Captain의 핵심 역할**:
- 모든 요청의 첫 번째 분석자
- 코딩이 필요 없는 요청 판별
- 적절한 워크플로우 선택

### Jarvis (Researcher)

| 속성 | 값 |
|------|-----|
| **역할** | 기술 조사, 문서 검색 |
| **권한** | read-only, web-search |
| **주요 기능** | 정보 수집, 기술 분석, 레퍼런스 검색 |

**사용 시나리오**:
- "Toss Place가 뭐야?" - 서비스 조사
- "이 기술 최신 트렌드 알려줘" - 기술 리서치
- "관련 라이브러리 찾아줘" - 대안 분석

### Dr.Strange (Architect)

| 속성 | 값 |
|------|-----|
| **역할** | 요구사항 분석, 시스템 설계 |
| **권한** | read-only |
| **주요 기능** | 아키텍처 설계, 기술 스택 결정, 요구사항 정의 |

**사용 시나리오**:
- 신규 프로젝트 아키텍처 설계
- 기술 스택 선택 조언
- 요구사항 명세서 작성

### Vision (Documentation)

| 속성 | 값 |
|------|-----|
| **역할** | 문서 작성, API 명세 |
| **권한** | read, write-docs-only |
| **주요 기능** | README 작성, API 문서화, 변경 이력 관리 |

**사용 시나리오**:
- API 문서 작성
- 사용자 가이드 작성
- 코드 주석 개선

### IronMan (Fullstack Developer)

| 속성 | 값 |
|------|-----|
| **역할** | 프론트엔드/백엔드 구현 |
| **권한** | read, write, edit, bash |
| **주요 기능** | React/Vue 개발, UI 구현, API 연동 |

**전문 분야**:
- React, Vue.js 컴포넌트 개발
- TypeScript 타입 시스템
- CSS/Tailwind 스타일링
- 상태 관리 (Redux, Context)

### Natasha (Backend Specialist)

| 속성 | 값 |
|------|-----|
| **역할** | 서버 로직, 데이터베이스 |
| **권한** | read, write, edit, bash |
| **주요 기능** | API 개발, DB 설계, 인증 시스템 |

**전문 분야**:
- REST/GraphQL API 설계
- 데이터베이스 스키마 설계
- 인증/권한 관리
- 서버 성능 최적화

### Groot (Test Specialist)

| 속성 | 값 |
|------|-----|
| **역할** | 테스트 작성, 품질 검증 |
| **권한** | read, write-test-only |
| **주요 기능** | 단위/통합/E2E 테스트, 커버리지 관리 |

**전문 분야**:
- Jest, Vitest 테스트 작성
- Testing Library 활용
- E2E 테스트 (Cypress, Playwright)
- TDD 워크플로우

## Agent Dispatch

```typescript
// 에이전트 호출 예시
avengers_dispatch_agent({
  agent: "ironman",
  task: "로그인 폼 컴포넌트 구현",
  worktree: true,
  priority: "high"
})
```

## Agent Communication

에이전트 간 소통은 M5에서 강화되었습니다:

```typescript
// 에이전트 간 메시지 전달
avengers_agent_communicate({
  from: "natasha",
  to: "ironman",
  type: "handoff",
  payload: {
    taskId: "T001",
    content: "API 구현 완료. 프론트엔드 연동 가능",
    artifacts: ["src/api/auth.ts"]
  }
})

// 전체 에이전트에게 브로드캐스트
avengers_broadcast({
  from: "captain",
  payload: {
    content: "Phase 5 완료. 검증 단계 시작",
    priority: "high"
  }
})
```

## Related Documents

- [Workflows](./WORKFLOWS.md) - 에이전트 협업 워크플로우
- [API Reference](./FEATURES.md) - 도구 상세 API
- [Examples](./EXAMPLES.md) - 사용 예시
