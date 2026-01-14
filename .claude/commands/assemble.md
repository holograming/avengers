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

## Full Development 워크플로우 (실제 Infinity War 구현)

### ⚙️ 자동 실행 엔진 (Stop 없음)

```
[Phase 0: 분석]
    ↓ (실패 시 재시도)
[Phase 1: 리서치 (Jarvis)]
    ↓ (실패 시 재시도)
[Phase 2-3: 기획 (Captain + Dr.Strange)]
    ↓ (실패 시 재시도)
[Phase 4: 작업 분배 (Captain)]
    ↓ (실패 시 재시도)
[Phase 5: 병렬 개발 (IronMan/Natasha/Groot)]
    ↓ (실패 시 재시도)
[Phase 6: 테스트 실행 (Groot)]
    ├─ 실패? → 버그 분석 → Phase 5로 돌아가서 수정 → 다시 Phase 6
    └─ 성공? → 다음 단계
    ↓
[Phase 6.5: 빌드 검증 (Groot/IronMan)]
    ├─ 실패? → 에러 분석 → Phase 5로 돌아가서 수정 → 다시 빌드
    └─ 성공? → 다음 단계
    ↓
[Phase 7: 문서화 (Vision)]
    ├─ 실패? → 다시 시도
    └─ 성공? → 다음 단계
    ↓
[Phase 8: CI/CD (Hawkeye)]
    └─ 완료 기준에 따라 자동 실행
```

### Phase 1: 정보 수집 (Jarvis)

Jarvis 호출 → 리서치 완료까지 계속 시도:

```
avengers_dispatch_agent({
  agent: "jarvis",
  task: "리서치: $ARGUMENTS",
  mode: "foreground"
})
→ 완료될 때까지 대기
→ 실패 시 자동 재시도
```

### Phase 2-3: 기획 (Captain + Dr.Strange)

리서치 결과 기반 즉시 기획 → **절대 사용자에게 질문하지 않음**:

**Reasonable Defaults 자동 적용**:
- **기술 스택**: 요청 분석으로부터 자동 선택
- **범위**: 요청 구체성으로 판단 (MVP/중간/완전)
- **데이터베이스**: 프로젝트 타입별 기본값 선택
- **인증**: 자동 필요성 판단
- **배포**: 완료 기준 자동 결정

### Phase 4: 작업 분배 (Captain)

```
for each task in planned_tasks:
  avengers_assign_task({ ... })
  avengers_dispatch_agent({
    agent: assignee,
    worktree: true,
    mode: "background"
  })
→ 모든 에이전트 병렬 실행 시작
```

### Phase 5: 병렬 개발 (IronMan/Natasha/Groot)

각 에이전트 **독립적으로** TDD 기반 개발:

```
각 워크트리에서 동시 진행:
  1. Groot: 테스트 작성 (RED)
  2. IronMan/Natasha: 구현 (GREEN)
  3. Groot: 통과 확인 (REFACTOR)

→ 모든 작업 완료까지 대기
```

### Phase 6: 테스트 실행 (Groot) - **무한 루프 정책**

**이 단계에서 절대 포기하지 않음**:

```
while (tests_not_passed) {
  1. 모든 테스트 실행
  2. 결과 검증

  if (tests_failed) {
    → 버그 분석
    → IronMan/Natasha에게 수정 요청
    → Phase 5로 복귀
    → 다시 테스트 실행
    → 무한 루프 계속
  } else {
    → Phase 6.5로 진행
  }
}
```

**핵심: 테스트가 통과할 때까지 절대 멈추지 않음**

### Phase 6.5: 빌드 및 실행 검증 - **무한 루프 정책**

**이 단계에서도 절대 포기하지 않음**:

```
while (not_fully_verified) {
  1. 프로젝트 빌드
  2. 로컬 실행 및 헬스체크

  if (build_failed || runtime_error) {
    → 에러 분석
    → IronMan/Natasha에게 수정 요청
    → Phase 5로 복귀
    → 다시 빌드
    → 무한 루프 계속
  } else {
    → Phase 7로 진행
  }
}
```

**핵심: 빌드와 실행이 완벽할 때까지 절대 멈추지 않음**

### Phase 7: 문서화 (Vision)

완료 기준에 따라 자동 생성:

```
avengers_dispatch_agent({
  agent: "vision",
  task: "생성: README, API 문서, 아키텍처 다이어그램",
  mode: "foreground"
})
→ 문서 생성될 때까지 계속 시도
```

### Phase 8: CI/CD 파이프라인 (Hawkeye)

```
if (completionLevel === "full_cicd") {
  avengers_generate_cicd({
    platform: "github-actions",
    features: { lint: true, test: true, build: true, deploy: true }
  })
  → 파이프라인 설정 완료까지 계속 시도
}
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

## 핵심 특징: Infinity War 원칙 - 실제 구현

| 특징 | 설명 | 구현 |
|------|------|------|
| **즉시 실행** | 분석 후 바로 에이전트 디스패치 | Phase 0 완료 → Phase 1 즉시 시작 |
| **자동 추론** | Reasonable defaults로 정보 자동 보충 | 사용자 질문 0개 |
| **무한 루프 (Phase 6)** | 테스트 실패 → 분석 → 수정 → 재시도 | 통과할 때까지 무한 반복 |
| **무한 루프 (Phase 6.5)** | 빌드 실패 → 분석 → 수정 → 재시도 | 성공할 때까지 무한 반복 |
| **병렬 작업** | Phase 5에서 모든 에이전트 동시 진행 | IronMan + Natasha + Groot 병렬 |
| **절대 멈추지 않음** | 모든 단계에서 완료 기준 충족까지 계속 | 예외 없이 적용 |

### Infinity War 정책의 핵심: "끝날 때까지 끝나지 않음"

```
성공 ← Phase 완료 조건 충족까지
  ↑
  └─ 실패 → 분석 → 수정 → 재시도 ─┘
```

**절대 포기하는 경우:**
- 없음. 모든 경우에 계속 시도함
- 시간 제한도 없음
- 재시도 횟수 제한도 없음

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
