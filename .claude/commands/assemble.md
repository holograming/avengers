---
disable-model-invocation: false
---

# Avengers Assemble

어벤져스를 소집하여 문제를 해결합니다.

**"There was an idea... to bring together a group of remarkable people."** — Nick Fury

## 실행 워크플로우

### Phase 0: 요청 분석 (Captain)

**첫 번째 단계로 반드시 `avengers_analyze_request` 호출**

```typescript
avengers_analyze_request({
  request: "$ARGUMENTS",
  forceResearch: true
})
```

분석 결과에 따라 적절한 워크플로우 선택:

### 조건부 워크플로우

```
┌─ Research Only (예: "X가 뭐야?")
│   └→ Jarvis → Captain → 응답 완료
│
├─ Planning Only (예: "X 어떻게 할지 계획 세워")
│   └→ Jarvis → Dr.Strange → Captain → 응답 완료
│
├─ Quick Fix (예: "이 버그 고쳐줘")
│   └→ IronMan/Natasha → Groot → Captain → 완료
│
├─ Documentation (예: "API 문서 작성해줘")
│   └→ Jarvis → Vision → Captain → 완료
│
└─ Full Development (예: "X 서비스 만들어줘")
    └→ 전체 팀 협업
```

## Full Development 워크플로우

### Phase 1: 정보 수집 (Jarvis)

```typescript
avengers_dispatch_agent({
  agent: "jarvis",
  task: "리서치: [요청 내용]",
  mode: "foreground"
})
```

### Phase 2: 요구사항 분석 (Captain + Dr.Strange)

- 리서치 결과 기반 분석
- **부족한 정보만** 사용자에게 질문
- 스코프 확정

### Phase 3: 전략 수립 (Dr.Strange)

```typescript
avengers_skill_brainstorm({
  phase: "start",
  topic: "[요청 주제]"
})
```

### Phase 4: 작업 분배 (Captain)

```typescript
avengers_assign_task({
  title: "작업 제목",
  assignee: "ironman",
  dependencies: []
})
```

### Phase 5: 병렬 실행 (IronMan + Natasha)

- TDD 기반 개발
- 워크트리 병렬 작업
- 에이전트 간 결과 공유

### Phase 6: 테스트 실행 (Groot) - 강화됨

```typescript
// 1. 실제 테스트 실행
avengers_run_tests({
  taskId: "T001",
  projectPath: "./",
  testType: "all",
  coverage: true
})

// 2. 테스트 결과로 완료 검증
avengers_validate_completion({
  taskId: "T001",
  testResults: { /* run_tests 결과 */ },
  strictness: "moderate"
})
```

**Infinity War 원칙**: 테스트가 통과할 때까지 다음 단계로 진행하지 않습니다.

### Phase 6.5: 빌드 및 실행 검증 (Groot/IronMan) - NEW

```typescript
// 1. 프로젝트 빌드
avengers_build_project({
  taskId: "T001",
  projectPath: "./",
  buildType: "production"
})

// 2. 로컬에서 실행 및 헬스체크
avengers_run_local({
  taskId: "T001",
  projectPath: "./",
  mode: "preview",
  healthCheck: { endpoint: "/health", expectedStatus: 200 }
})

// 3. 검증 완료 후 프로세스 종료
avengers_stop_process({ taskId: "T001" })
```

### Phase 7: 문서화 (Vision + Captain)

- Vision: API 문서, README 업데이트
- Captain: 완료 검증 후 결과 보고

### Phase 8: 배포 파이프라인 (Hawkeye) - NEW

```typescript
// CI/CD 설정 생성
avengers_generate_cicd({
  taskId: "T001",
  projectPath: "./",
  platform: "github-actions",
  projectType: "auto-detect",
  features: { lint: true, test: true, build: true, deploy: true },
  deployment: {
    target: "docker",
    environments: ["staging", "production"],
    strategy: "blue-green"
  }
})
```

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
/assemble {문제_설명}
```

예시:
```
/assemble Toss Place 서비스가 뭐야?       → Research Only
/assemble REST API 설계해줘              → Planning Only
/assemble 로그인 버그 고쳐줘              → Quick Fix
/assemble 사용자 인증 시스템 구현해줘      → Full Development
```

## 인수

$ARGUMENTS - 해결할 문제 또는 작업 설명

Captain이 요청을 분석하고 적절한 에이전트 팀을 소집합니다.
