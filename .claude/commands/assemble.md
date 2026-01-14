---
disable-model-invocation: false
---

# Avengers Assemble

어벤져스를 소집하여 문제를 해결합니다.

**"There was an idea... to bring together a group of remarkable people."** — Nick Fury

## 실행 워크플로우

### Phase 0: 요청 분석 (Captain) - 즉시 실행

**첫 번째 단계: `avengers_analyze_request` 호출로 즉시 분석 시작**

```typescript
avengers_analyze_request({
  request: "$ARGUMENTS",
  forceResearch: true,
  executionMode: "auto"  // 자동 모드로 워크플로우 자동 결정
})
```

분석 결과에 따라 즉시 적절한 워크플로우 자동 선택:

### 조건부 워크플로우 (자동 실행)

분석 결과의 `mode` 필드에 따라 즉시 에이전트 디스패치:

**mode: "planning"** (Research/Planning 요청)
```
Jarvis → Dr.Strange → Captain → 즉시 응답 완료
(사용자 질문 없음. Reasonable defaults로 진행)
```

**mode: "execution"** (Development 요청)
```
Phase 1: Jarvis 리서치 (병렬)
Phase 2-3: Dr.Strange 전략 수립 (병렬)
Phase 4: Captain 작업 분배 (병렬)
Phase 5-8: IronMan/Natasha/Groot 병렬 실행
→ 끝날 때까지 계속 시도 (Infinity War 원칙)
```

### 핵심 원칙: Infinity War (끝날 때까지 끝나지 않음)

- ✅ **즉시 실행**: 분석 후 바로 에이전트 디스패치
- ✅ **자동 추론**: Reasonable defaults로 부족한 정보 자동 보충
- ✅ **최소 질문**: 불가능한 경우에만 사용자에게 질문
- ✅ **끝까지 진행**: 테스트 통과/검증 완료까지 멈추지 않음
- ✅ **병렬 작업**: 독립적 작업은 동시에 진행 (Worktree)

## Full Development 워크플로우

### Phase 1: 정보 수집 (Jarvis)

```typescript
avengers_dispatch_agent({
  agent: "jarvis",
  task: "리서치: [요청 내용]",
  mode: "foreground"
})
```

### Phase 2: 요구사항 분석 (Captain + Dr.Strange) - 자동 추론

리서치 결과를 기반으로 **Reasonable Defaults**로 자동 추론:

- **기술 스택**: 요청 내용으로부터 자동 선택 (웹/모바일/데스크톱/AI 등)
- **범위**: 요청의 구체성으로 판단 (MVP/중간/완전)
- **데이터베이스**: 프로젝트 타입으로 기본값 선택 (PostgreSQL/SQLite/MongoDB 등)
- **인증**: 필요 여부 자동 판단
- **배포**: 완료 기준에 따라 자동 결정

**사용자 질문은 불가능한 경우에만** (예: 보안 정책, 법적 요구사항 등)

### Phase 3: 전략 수립 (Dr.Strange) - 자동 실행

요구사항 분석 결과에 따라 즉시 전략 수립:

```typescript
avengers_skill_brainstorm({
  phase: "finalize",
  topic: "[요청 주제]",
  context: {
    analysis: "[Phase 2 분석 결과]",
    scope: "[자동 결정된 범위]",
    techStack: "[자동 선택된 기술 스택]"
  }
})
```

→ **설계 문서 생성** (아키텍처, 컴포넌트, 워크플로우)

### Phase 4: 작업 분배 및 병렬 실행 (Captain)

전략을 기반으로 **즉시 작업 분배**:

```typescript
avengers_assign_task({
  title: "[구체적 작업]",
  assignee: "[에이전트]",  // ironman, natasha, groot 등
  dependencies: []
})

// 각 에이전트에 즉시 디스패치
avengers_dispatch_agent({
  agent: "[할당 에이전트]",
  task: "[작업 내용]",
  worktree: true,  // 병렬 작업을 위해 워크트리 격리
  mode: "background"  // 배경 실행으로 병렬 처리
})
```

### Phase 5: 병렬 개발 (모든 에이전트 동시 진행)

**TDD 기반 병렬 작업**:
- 🧪 Groot: 단위 테스트 작성 (RED)
- 💻 IronMan/Natasha: 코드 구현 (GREEN)
- ✅ Groot: 테스트 통과 확인 (REFACTOR)
- 🔄 에이전트 간 결과 공유 (Worktree merge 준비)

### Phase 6: 테스트 실행 (Groot) - 자동 반복

**테스트 통과까지 계속 시도** (Infinity War 원칙):

```typescript
// 1. 모든 테스트 실행
avengers_run_tests({
  taskId: "T001",
  projectPath: "./",
  testType: "all",
  coverage: true
})

// 2. 테스트 결과 검증
avengers_validate_completion({
  taskId: "T001",
  testResults: { /* run_tests 결과 */ },
  strictness: "moderate"  // 테스트 통과 필수
})

// 3. 실패 시 → Groot이 버그 분석 → IronMan/Natasha 수정 → 다시 테스트
// → 통과할 때까지 반복!
```

### Phase 6.5: 빌드 및 실행 검증 (Groot/IronMan) - 자동 실행

**통과 기준에 따라 자동 진행**:

```typescript
// 1. 프로젝트 빌드
avengers_build_project({
  projectPath: "./",
  buildType: "production"
})

// 2. 로컬 실행 및 헬스 체크
avengers_run_local({
  projectPath: "./",
  mode: "preview"
})

// 3. 실패 시 → 에러 분석 → 수정 → 재빌드 (반복!)
```

### Phase 7: 문서화 (Vision) - 자동 생성

완료 기준에 따라 **자동 문서화**:
- **API 문서**: OpenAPI/Swagger 자동 생성
- **README**: 프로젝트 설정 및 사용 가이드
- **아키텍처 다이어그램**: 설계 기반 생성
- **코드 주석**: 복잡한 로직 자동 주석 추가

### Phase 8: 배포 파이프라인 (Hawkeye) - 완료 기준별 자동 실행

**완료 기준이 `full_cicd`인 경우만 실행**:

```typescript
avengers_generate_cicd({
  projectPath: "./",
  platform: "github-actions",  // 자동 감지
  features: { lint: true, test: true, build: true, deploy: true }
})
```

→ **자동 배포 파이프라인 생성** (GitHub Actions, Docker 등)

## 완료 기준별 Phase 실행

| 완료 기준 | 실행 Phase | 사용 시나리오 |
|----------|-----------|--------------|
| `code_only` | 0-5 | 프로토타입, 빠른 실험 |
| `with_tests` | 0-6 | 일반 개발 (기본값) |
| `with_execution` | 0-6.5 | 중요 기능, 사용자 대면 |
| `with_docs` | 0-7 | API 공개, 팀 공유 |
| `full_cicd` | 0-8 | 프로덕션 배포 |

## 사용법

```
/assemble {상세한_요청_설명}
```

### 사용 예시

```
✅ /assemble Toss Place 클론 데스크톱 앱 만들어줘
   → 즉시 Phase 0-8 시작 (분석 → 설계 → 개발 → 테스트 → 완료)

✅ /assemble 사용자 인증 시스템 구현
   → 즉시 풀 개발 사이클 시작

✅ /assemble REST API 설계해줘
   → 즉시 계획 수립 (Jarvis → Dr.Strange → 설계 완료)

✅ /assemble 로그인 버그 고쳐줘
   → 즉시 버그 분석 → 수정 → 테스트 (반복!)
```

## 핵심 특징: Infinity War 원칙

| 특징 | 설명 |
|------|------|
| **즉시 실행** | 분석 후 바로 에이전트 디스패치 (질문 없음) |
| **자동 추론** | Reasonable defaults로 부족한 정보 자동 보충 |
| **병렬 작업** | 독립적 작업은 Worktree로 동시 진행 |
| **끝까지 진행** | 테스트 통과/검증 완료까지 멈추지 않음 |
| **자동 수정** | 에러/실패 시 자동 분석 → 수정 → 재시도 |

## 주의사항

⚠️ **사용자 질문은 최소화됩니다**
- 불가능한 경우 (보안, 법적 요구사항)에만 질문
- 대부분의 정보는 자동 추론으로 진행
- 필요시 설정 변경 후 재실행 가능

🎯 **품질 보장**
- TDD 기반 개발 (테스트 먼저)
- 모든 단계에서 검증 (테스트 통과까지 반복)
- 최종 E2E 테스트로 동작 확인

## 파라미터

$ARGUMENTS - 요청할 작업의 상세 설명 (더 구체할수록 좋음)

**Captain이 즉시 분석을 시작하고 에이전트 팀을 소집합니다. 끝날 때까지 계속 진행합니다.**
