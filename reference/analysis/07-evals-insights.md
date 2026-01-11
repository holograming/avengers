# AI 에이전트 평가(Evals) 인사이트 분석

**분석 대상:** `reference/docs/07_demystifying_evals_for_ai_agents.md`
**참고 문서:** 01-06 문서 (멀티 에이전트, Agent SDK, Skills, 도구 사용, MCP, Claude Code)
**작성일:** 2026-01-11
**작성자:** Jarvis (리서처 에이전트)

---

## 1. 핵심 인사이트 요약

### 1.1 평가(Eval)의 본질

평가는 AI 시스템에 대한 테스트로, 입력을 주고 출력에 채점 로직을 적용하여 성공을 측정한다. 에이전트 평가는 단순 단일 턴 평가와 달리 **다중 턴, 상태 변경, 도구 호출**이 포함되어 복잡도가 높다.

### 1.2 평가의 핵심 구성 요소

| 구성 요소 | 설명 |
|-----------|------|
| **Task (테스크)** | 정의된 입력과 성공 기준을 가진 단일 테스트 |
| **Trial (시도)** | 태스크에 대한 각 시도. 모델 출력이 실행마다 다르므로 여러 번 실행 |
| **Grader (채점기)** | 에이전트 성능의 특정 측면을 점수화하는 로직 |
| **Transcript (기록)** | 출력, 도구 호출, 추론, 중간 결과를 포함한 시도의 완전한 기록 |
| **Outcome (결과)** | 시도 종료 시 환경의 최종 상태 |

### 1.3 평가를 구축해야 하는 이유

1. **리액티브 루프 탈출**: 프로덕션에서만 문제를 발견하는 반복에서 벗어남
2. **변경 사항 검증**: 수백 개 시나리오에 대해 자동 테스트 가능
3. **모델 업그레이드 가속화**: 새 모델 출시 시 신속한 평가로 경쟁 우위 확보
4. **제품-연구 팀 간 소통**: 연구팀이 최적화할 수 있는 명확한 메트릭 제공

### 1.4 채점기 유형별 특성

| 채점기 유형 | 장점 | 단점 |
|-------------|------|------|
| **코드 기반** | 빠름, 저렴, 객관적, 재현 가능 | 유효한 변형에 취약, 뉘앙스 부족 |
| **모델 기반** | 유연함, 확장 가능, 뉘앙스 포착 | 비결정적, 비용 높음, 교정 필요 |
| **인간 기반** | 골드 스탠다드 품질, 전문가 판단 | 비용 높음, 느림, 확장 어려움 |

### 1.5 Capability vs. Regression 평가

- **Capability 평가**: "이 에이전트가 무엇을 잘 할 수 있는가?" - 낮은 통과율에서 시작
- **Regression 평가**: "에이전트가 이전에 처리하던 모든 작업을 여전히 처리할 수 있는가?" - 거의 100% 통과율 유지

---

## 2. Avengers 프로젝트 즉시 적용 가능 권장사항

### 2.1 평가 인프라 구축

```typescript
// 권장: 평가 태스크 정의 구조
interface AvengersEvalTask {
  id: string;
  description: string;
  graders: Grader[];
  trackedMetrics: Metric[];
  referenceSolution?: string;  // 검증된 정답
}

// 권장: 에이전트별 평가 스위트
interface AvengersEvalSuite {
  agent: 'captain' | 'ironman' | 'natasha' | 'groot' | 'jarvis' | 'dr-strange' | 'vision';
  capabilityTasks: AvengersEvalTask[];
  regressionTasks: AvengersEvalTask[];
}
```

### 2.2 TDD 워크플로우와 평가 통합

현재 `avengers_skill_tdd`를 활용한 평가 통합 방안:

```typescript
// 기존 TDD 스킬에 평가 레이어 추가
avengers_skill_tdd({
  phase: "complete",
  feature: "user-auth",
  evalConfig: {
    runTrials: 3,           // 여러 번 실행으로 비결정성 처리
    graders: ['deterministic_tests', 'llm_rubric'],
    trackMetrics: ['n_turns', 'n_toolcalls', 'time_to_completion']
  }
})
```

### 2.3 즉시 적용 가능한 20-50개 초기 평가 태스크 소스

1. **버그 리포트**: 이전에 발생한 버그를 테스트 케이스로 변환
2. **사용자 피드백**: 에이전트가 실패한 실제 사용 사례
3. **엣지 케이스**: 각 에이전트의 경계 조건 테스트
4. **코드 리뷰 피드백**: 리뷰에서 발견된 문제를 평가 태스크로 변환

### 2.4 Worktree 기반 격리된 평가 환경

```typescript
// 평가 실행 시 격리 환경 보장
avengers_dispatch_agent({
  agent: "ironman",
  task: "평가 태스크 실행",
  worktree: true,  // 격리된 환경에서 실행
  evalMode: true   // 평가 모드 플래그
})
```

### 2.5 코드 리뷰 스킬과 평가 연계

```typescript
// 코드 리뷰 완료 후 자동 평가 트리거
avengers_skill_code_review({
  phase: "approve",
  taskId: "T001",
  autoRunEval: true,
  evalSuite: "regression"  // 회귀 테스트 자동 실행
})
```

---

## 3. 에이전트별 평가 전략 제안

### 3.1 Captain (오케스트레이터)

| 평가 영역 | 채점 방법 | 주요 메트릭 |
|-----------|-----------|-------------|
| 작업 분해 품질 | LLM 루브릭 | 하위 작업 수, 의존성 정확도 |
| 에이전트 할당 적절성 | 코드 기반 | 올바른 에이전트 선택 비율 |
| 병렬화 효율성 | 코드 기반 | 병렬 처리 가능한 태스크 식별률 |
| 조율 품질 | LLM 루브릭 | 에이전트 간 충돌 발생 빈도 |

```typescript
// Captain 평가 예시
const captainEval = {
  graders: [
    { type: 'llm_rubric', rubric: 'prompts/task_decomposition_quality.md' },
    { type: 'state_check', expect: { all_agents_assigned: true } },
    { type: 'transcript', max_coordination_turns: 5 }
  ]
};
```

### 3.2 IronMan (풀스택 개발자)

| 평가 영역 | 채점 방법 | 주요 메트릭 |
|-----------|-----------|-------------|
| 코드 정확성 | 결정론적 테스트 | 테스트 통과율 |
| 코드 품질 | 정적 분석 (ESLint, TypeScript) | 린트 오류 수 |
| UI 구현 정확도 | 스크린샷 비교 | 시각적 일치도 |
| 구현 효율성 | 코드 기반 | 도구 호출 수, 토큰 사용량 |

```typescript
// IronMan 평가 예시
const ironmanEval = {
  graders: [
    { type: 'deterministic_tests', required: ['unit', 'integration'] },
    { type: 'static_analysis', commands: ['eslint', 'tsc', 'prettier'] },
    { type: 'llm_rubric', rubric: 'prompts/code_quality.md' },
    { type: 'visual_comparison', reference: 'mocks/expected_ui.png' }
  ]
};
```

### 3.3 Natasha (백엔드 개발자)

| 평가 영역 | 채점 방법 | 주요 메트릭 |
|-----------|-----------|-------------|
| API 정확성 | 결정론적 테스트 | 엔드포인트 테스트 통과율 |
| 보안 검증 | 정적 분석 (Bandit 등) | 보안 취약점 수 |
| DB 쿼리 효율성 | 코드 기반 | 쿼리 실행 시간, N+1 문제 |
| 에러 처리 | LLM 루브릭 | 예외 처리 완성도 |

```typescript
// Natasha 평가 예시
const natashaEval = {
  graders: [
    { type: 'deterministic_tests', required: ['api_tests', 'db_tests'] },
    { type: 'static_analysis', commands: ['bandit', 'mypy', 'sqlcheck'] },
    { type: 'state_check', expect: { db_state: 'expected_schema' } },
    { type: 'tool_calls', required: [
      { tool: 'run_migrations' },
      { tool: 'run_tests' }
    ]}
  ]
};
```

### 3.4 Groot (테스트 전문가)

| 평가 영역 | 채점 방법 | 주요 메트릭 |
|-----------|-----------|-------------|
| 테스트 커버리지 | 코드 기반 | 라인/브랜치 커버리지 % |
| 테스트 품질 | LLM 루브릭 | 엣지 케이스 포함 여부 |
| 테스트 독립성 | 코드 기반 | 테스트 간 의존성 |
| 테스트 실행 시간 | 코드 기반 | 평균 테스트 실행 시간 |

```typescript
// Groot 평가 예시
const grootEval = {
  graders: [
    { type: 'coverage_check', min_coverage: 80 },
    { type: 'llm_rubric', rubric: 'prompts/test_quality.md' },
    { type: 'deterministic_tests', required: ['test_independence_check'] },
    { type: 'transcript', metrics: ['test_execution_time'] }
  ]
};
```

### 3.5 Jarvis (리서처)

| 평가 영역 | 채점 방법 | 주요 메트릭 |
|-----------|-----------|-------------|
| 정보 정확성 | LLM 루브릭 + 사실 확인 | 정확한 정보 비율 |
| 출처 품질 | 코드 기반 | 권위 있는 출처 사용 비율 |
| 완성도 | LLM 루브릭 | 요청된 모든 측면 커버 여부 |
| 인용 정확성 | 코드 기반 | 인용-주장 일치율 |

```typescript
// Jarvis 평가 예시
const jarvisEval = {
  graders: [
    { type: 'llm_rubric', rubric: 'prompts/research_quality.md', assertions: [
      '주장이 출처에 의해 지지됨',
      '모든 요청 측면이 커버됨',
      '1차 출처 우선 사용'
    ]},
    { type: 'citation_check', expect: { citation_accuracy: '>= 0.95' } },
    { type: 'source_quality', min_authority_score: 0.7 }
  ]
};
```

### 3.6 Dr. Strange (기획자)

| 평가 영역 | 채점 방법 | 주요 메트릭 |
|-----------|-----------|-------------|
| 요구사항 완성도 | LLM 루브릭 | 누락된 요구사항 수 |
| 설계 일관성 | LLM 루브릭 | 아키텍처 패턴 준수 |
| 실현 가능성 | LLM 루브릭 | 기술적 실현 가능성 점수 |
| 명확성 | LLM 루브릭 | 모호한 표현 수 |

```typescript
// Dr. Strange 평가 예시
const drStrangeEval = {
  graders: [
    { type: 'llm_rubric', rubric: 'prompts/requirements_quality.md' },
    { type: 'llm_rubric', rubric: 'prompts/design_consistency.md' },
    { type: 'checklist', items: [
      '모든 엣지 케이스 정의',
      '비기능적 요구사항 포함',
      '제약 조건 명시'
    ]}
  ]
};
```

### 3.7 Vision (문서화 담당)

| 평가 영역 | 채점 방법 | 주요 메트릭 |
|-----------|-----------|-------------|
| 문서 정확성 | 코드-문서 비교 | 코드와 문서 일치율 |
| 가독성 | LLM 루브릭 | 가독성 점수 |
| 완성도 | 코드 기반 | API 문서화 커버리지 |
| 예제 품질 | 결정론적 테스트 | 예제 코드 실행 성공률 |

```typescript
// Vision 평가 예시
const visionEval = {
  graders: [
    { type: 'doc_code_sync', tolerance: 0.95 },
    { type: 'llm_rubric', rubric: 'prompts/documentation_quality.md' },
    { type: 'deterministic_tests', required: ['example_execution_tests'] },
    { type: 'coverage_check', type: 'api_documentation', min: 90 }
  ]
};
```

---

## 4. 비결정성 처리 전략

### 4.1 pass@k와 pass^k 이해

| 메트릭 | 정의 | 사용 시점 |
|--------|------|----------|
| **pass@k** | k번 시도 중 최소 1번 성공 확률 | 한 번의 성공이 중요한 경우 |
| **pass^k** | k번 시도 모두 성공 확률 | 일관성이 필수인 경우 |

```
k=1일 때: pass@1 = pass^1 (동일)
k=10일 때:
  - pass@10: 거의 100%에 근접 (성공 기회 증가)
  - pass^10: 0%에 근접 (모든 시도 성공 요구)
```

### 4.2 Avengers 프로젝트 적용 전략

#### 에이전트별 권장 메트릭

| 에이전트 | 권장 메트릭 | 권장 k 값 | 이유 |
|----------|-------------|-----------|------|
| Captain | pass^3 | k=3 | 오케스트레이션 일관성 필수 |
| IronMan | pass@3 | k=3 | 코드 생성의 다양한 접근 허용 |
| Natasha | pass^5 | k=5 | 백엔드 API 안정성 필수 |
| Groot | pass^3 | k=3 | 테스트 일관성 필수 |
| Jarvis | pass@5 | k=5 | 리서치 다양한 경로 허용 |
| Dr. Strange | pass@3 | k=3 | 기획 다양한 관점 허용 |
| Vision | pass^3 | k=3 | 문서 일관성 필수 |

#### 구현 예시

```typescript
// 비결정성 처리 평가 함수
interface EvalConfig {
  trials: number;           // k 값
  metric: 'pass_at_k' | 'pass_pow_k';
  minPassRate: number;      // 최소 통과율
}

async function runEvalWithNonDeterminism(
  task: AvengersEvalTask,
  agent: string,
  config: EvalConfig
): Promise<EvalResult> {
  const results: boolean[] = [];

  for (let i = 0; i < config.trials; i++) {
    // 각 시도마다 격리된 환경에서 실행
    const result = await runIsolatedTrial(task, agent);
    results.push(result.passed);
  }

  const successCount = results.filter(r => r).length;

  if (config.metric === 'pass_at_k') {
    // 최소 1번 성공
    return { passed: successCount >= 1, successRate: successCount / config.trials };
  } else {
    // 모든 시도 성공
    return { passed: successCount === config.trials, successRate: successCount / config.trials };
  }
}
```

### 4.3 멀티 에이전트 시스템 특수 고려사항

01 문서(멀티 에이전트 연구 시스템)에서 언급된 바와 같이:

1. **창발적 행동**: 리드 에이전트의 작은 변경이 서브 에이전트 행동에 예측 불가능한 영향
2. **상호작용 패턴**: 개별 에이전트 행동보다 상호작용 패턴 이해가 중요

```typescript
// 멀티 에이전트 평가 전략
const multiAgentEvalConfig = {
  // 전체 워크플로우 평가 (end-to-end)
  e2eTrials: 5,
  e2eMetric: 'pass_at_k',

  // 개별 에이전트 평가 (격리)
  isolatedTrials: 3,
  isolatedMetric: 'pass_pow_k',

  // 상호작용 평가
  interactionChecks: [
    'no_duplicate_work',
    'proper_handoff',
    'resource_efficiency'
  ]
};
```

### 4.4 시도 횟수(k) 결정 가이드

| 상황 | 권장 k 값 | 근거 |
|------|-----------|------|
| 초기 개발 단계 | k=3 | 빠른 피드백 사이클 |
| 회귀 테스트 | k=5 | 안정성 확보 |
| 프로덕션 전 검증 | k=10 | 높은 신뢰도 필요 |
| CI/CD 파이프라인 | k=3 | 속도와 신뢰도 균형 |
| 복잡한 태스크 | k=5-10 | 변동성 높음 |

### 4.5 통계적 유의성 확보

```typescript
// 통계적으로 의미 있는 결과를 위한 최소 시도 횟수
function calculateMinTrials(
  expectedPassRate: number,
  confidenceLevel: number = 0.95,
  marginOfError: number = 0.05
): number {
  const z = 1.96; // 95% 신뢰수준
  const p = expectedPassRate;
  const e = marginOfError;

  // 표본 크기 공식
  const n = Math.ceil((z * z * p * (1 - p)) / (e * e));
  return Math.max(n, 3); // 최소 3회
}

// 예시: 80% 통과율 예상 시
// calculateMinTrials(0.8) => 약 246회 (높은 정확도)
// 실용적으로는 20-50회로 시작 권장
```

---

## 5. 구현 로드맵

### 5.1 Phase 1: 기초 (Week 1-2)

1. 20-50개 초기 평가 태스크 수집
2. 기본 평가 하네스 구축
3. 결정론적 채점기 구현 (테스트 통과/실패)

### 5.2 Phase 2: 확장 (Week 3-4)

1. LLM 기반 채점기 추가
2. 에이전트별 평가 스위트 구축
3. pass@k, pass^k 메트릭 구현

### 5.3 Phase 3: 성숙 (Week 5-6)

1. CI/CD 통합
2. 평가 대시보드 구축
3. Capability -> Regression 평가 졸업 프로세스

### 5.4 Phase 4: 최적화 (Ongoing)

1. 평가 포화도 모니터링
2. 새로운 태스크 지속 추가
3. 채점기 인간 판단 교정

---

## 6. 참고 문서 연계 인사이트

### 6.1 01 문서 (멀티 에이전트) 연계

- 서브 에이전트 사용 시 end-to-end 평가와 개별 평가 모두 필요
- 토큰 사용량이 성능의 80% 설명 -> 토큰 효율성 메트릭 중요

### 6.2 02 문서 (Agent SDK) 연계

- "수집 -> 행동 -> 검증" 루프를 평가에 반영
- 검증 단계의 규칙 기반 피드백을 채점기로 재사용

### 6.3 03 문서 (Skills) 연계

- 스킬별 평가 태스크 정의
- 점진적 공개(Progressive Disclosure) 패턴을 평가 복잡도에 적용

### 6.4 06 문서 (Claude Code Best Practices) 연계

- TDD 워크플로우를 평가 프레임워크와 통합
- CLAUDE.md에 평가 가이드라인 포함 권장

---

## 7. 결론

AI 에이전트 평가는 **"나중에 할 일"이 아닌 "지금 해야 할 일"**이다. 문서에서 강조한 것처럼:

> "평가 없이 구축하는 팀은 반응적 루프에 갇히게 된다 - 하나의 실패를 고치면 또 다른 것이 생기고, 진짜 회귀인지 노이즈인지 구분할 수 없다."

Avengers 프로젝트에서는:

1. **TDD 필수 원칙**을 평가와 통합하여 자연스러운 회귀 테스트 구축
2. **Worktree 격리**를 활용한 깨끗한 평가 환경 보장
3. **에이전트별 특화 평가**로 각 역할의 품질 보장
4. **pass@k / pass^k** 메트릭으로 비결정성 체계적 관리

이를 통해 프로덕션 품질의 멀티 에이전트 시스템을 구축할 수 있다.

---

*이 문서는 Jarvis 에이전트에 의해 작성되었습니다.*
