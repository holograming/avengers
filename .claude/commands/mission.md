---
disable-model-invocation: false
---

# Start Mission

새로운 임무를 시작합니다.

## M5: 유연한 워크플로우

**핵심 원칙**: 모든 요청이 코딩을 필요로 하지 않습니다.
Captain이 요청 유형을 판단하여 필요한 에이전트만 호출합니다.

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
    └→ 전체 Phase 1-7 실행
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

- 용어/서비스 웹 검색
- 기술 스택 분석
- 요구사항 추론

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

```typescript
avengers_update_shared_context({
  taskId: "T001",
  agent: "natasha",
  files: ["src/api.ts"],
  summary: "API 구현 완료"
})
```

### Phase 6: 검증 (Groot)

```typescript
avengers_validate_completion({
  taskId: "T001",
  testResults: { ... },
  strictness: "moderate"
})
```

- **모든 테스트 통과 필수**
- 커버리지/문서화 권장
- 실패 시 → Phase 5 루프백

**Infinity War 원칙**: 끝날 때까지 끝나지 않습니다.

### Phase 7: 마무리 (Vision + Captain)

- Vision: 문서화
- Captain: 완료 검증 후 선언

## 사용법

```
/mission {mission_description}
```

예시:
```
/mission Toss Place 서비스가 뭐야?       → Research Only
/mission REST API 설계해줘              → Planning Only
/mission 로그인 버그 고쳐줘              → Quick Fix
/mission 사용자 인증 시스템 구현해줘      → Full Development
```

## 인수

$ARGUMENTS - 임무 설명

Captain이 요청을 분석하고 적절한 워크플로우를 선택합니다.
