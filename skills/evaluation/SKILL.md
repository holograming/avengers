# Evaluation Skill

AI 에이전트의 성능을 체계적으로 평가합니다.

## Quick Start

```typescript
// 평가 스위트 정의
const evalSuite = {
  tasks: ["task-1", "task-2"],
  graders: ["code-based", "model-based"],
  trials: 5
}
```

---

## 개요 및 목적 (Overview & Purpose)

**평가(Evaluation)**는 AI 시스템에 대한 테스트입니다. AI에게 입력을 제공하고, 출력에 채점 로직을 적용하여 성공을 측정합니다.

### 왜 평가가 필요한가?

1. **품질 보증**: 프로덕션 배포 전 문제 발견
2. **회귀 방지**: 변경으로 인한 기존 기능 손상 감지
3. **정량적 측정**: "느낌"이 아닌 데이터 기반 의사결정
4. **빠른 반복**: 새 모델 도입 시 신속한 검증

### 핵심 용어

| 용어 | 설명 |
|------|------|
| **Task** | 정의된 입력과 성공 기준을 가진 단일 테스트 케이스 |
| **Trial** | 태스크의 각 시도 (비결정성 때문에 여러 번 실행) |
| **Grader** | 에이전트 성능을 채점하는 로직 |
| **Transcript** | 시도의 전체 기록 (출력, 도구 호출, 추론 등) |
| **Outcome** | 시도 종료 시 환경의 최종 상태 |

---

## 3가지 그레이더 유형 (Grader Types)

### 1. 코드 기반 그레이더 (Code-based Graders)

결정론적이고 재현 가능한 평가를 제공합니다.

```yaml
graders:
  - type: deterministic_tests
    required: [test_auth.py, test_login.py]
  - type: static_analysis
    commands: [eslint, tsc, bandit]
  - type: tool_calls
    required:
      - {tool: read_file, params: {path: "src/*"}}
      - {tool: edit_file}
```

| 방법 | 설명 |
|------|------|
| 문자열 매칭 (String match) | 정확 일치, 정규식, 퍼지 매칭 |
| 바이너리 테스트 (Binary tests) | fail-to-pass, pass-to-pass |
| 정적 분석 (Static analysis) | 린트, 타입, 보안 검사 |
| 결과 검증 (Outcome verification) | 최종 상태 확인 |
| 도구 호출 검증 (Tool calls) | 사용된 도구와 파라미터 확인 |
| 트랜스크립트 분석 (Transcript) | 턴 수, 토큰 사용량 |

**장점**: 빠름, 저렴, 객관적, 재현 가능, 디버깅 용이

**단점**: 유효한 변형에 취약, 뉘앙스 부족, 주관적 태스크 평가 제한

### 2. 모델 기반 그레이더 (Model-based Graders)

LLM을 사용하여 유연하고 뉘앙스 있는 평가를 제공합니다.

```yaml
graders:
  - type: llm_rubric
    rubric: prompts/code_quality.md
    assertions:
      - "코드가 에러를 적절히 처리하는가"
      - "명확한 변수명을 사용하는가"
      - "불필요한 복잡성이 없는가"
```

| 방법 | 설명 |
|------|------|
| 루브릭 기반 점수 (Rubric-based) | 정의된 기준으로 점수화 |
| 자연어 어서션 (NL assertions) | 자연어로 조건 확인 |
| 쌍비교 (Pairwise comparison) | 두 결과 비교 |
| 참조 기반 평가 (Reference-based) | 참조 솔루션과 비교 |
| 다중 심사 합의 (Multi-judge) | 여러 LLM 판단 종합 |

**장점**: 유연함, 확장 가능, 뉘앙스 포착, 개방형 태스크 처리

**단점**: 비결정적, 코드보다 비용이 높음, 인간 그레이더와 보정 필요

### 3. 인간 기반 그레이더 (Human Graders)

최고 품질의 판단을 제공하지만 비용이 높습니다.

| 방법 | 설명 |
|------|------|
| SME 리뷰 (SME review) | 분야 전문가 검토 |
| 크라우드소싱 (Crowdsourced) | 대규모 인간 판단 |
| 스팟 체크 (Spot-check) | 샘플링 검토 |
| A/B 테스팅 | 변형 간 실사용자 비교 |
| 평가자 간 일치도 (Inter-annotator) | 일관성 측정 |

**장점**: 골드 스탠다드 품질, 전문가 판단과 일치

**단점**: 비용이 높음, 느림, 대규모 전문가 접근 필요

---

## 평가 메트릭 (Evaluation Metrics)

### pass@k

**"k번의 시도 중 최소 1번 성공할 확률"**

```
pass@k = 1 - (1 - success_rate)^k
```

- k가 증가하면 pass@k 점수도 상승
- pass@1 = 50%: 첫 시도에서 절반의 태스크 성공
- 코딩 에이전트에서는 보통 pass@1이 중요

**사용 시나리오**: 여러 솔루션 중 하나만 맞으면 되는 경우

### pass^k

**"k번의 시도 모두 성공할 확률"**

```
pass^k = success_rate^k
```

- k가 증가하면 pass^k 점수는 하락
- 75% 성공률로 3회 시도 시: (0.75)^3 = 42%
- 일관성이 중요한 고객 대면 에이전트에 필수

**사용 시나리오**: 매번 신뢰할 수 있는 동작이 필요한 경우

### 비교 차트

```
k=1:   pass@1 = pass^1 = success_rate (동일)
k=10:  pass@10 → 100%에 근접 (최소 1번 성공)
       pass^10 → 0%에 근접 (모두 성공)
```

| 메트릭 | k=1 | k=5 | k=10 |
|--------|-----|-----|------|
| pass@k (75% success) | 75% | 99% | ~100% |
| pass^k (75% success) | 75% | 24% | 6% |

---

## 능력 평가 vs 회귀 평가

### 능력 평가 (Capability Evals)

**"이 에이전트가 무엇을 잘하는가?"**

```typescript
const capabilityEval = {
  type: "capability",
  targetPassRate: "low",  // 낮은 통과율에서 시작
  purpose: "에이전트가 어려워하는 태스크 측정",
  action: "개선의 여지 (hill to climb) 제공"
}
```

- 낮은 통과율에서 시작
- 에이전트가 어려워하는 태스크 타겟
- 팀에게 개선 목표 제시

### 회귀 평가 (Regression Evals)

**"에이전트가 여전히 잘 처리하는가?"**

```typescript
const regressionEval = {
  type: "regression",
  targetPassRate: "~100%",  // 거의 100% 통과율 유지
  purpose: "기존 기능 손상 방지",
  action: "점수 하락 시 수정 필요"
}
```

- 거의 100% 통과율 유지
- 후퇴 방지
- 점수 하락 = 수정 필요 신호

### 평가 졸업 (Eval Graduation)

```
능력 평가 (낮은 통과율)
    ↓ 개선
능력 평가 (높은 통과율)
    ↓ 졸업
회귀 평가 (지속적 모니터링)
```

높은 통과율의 능력 평가는 회귀 스위트로 "졸업"하여 지속적으로 실행됩니다.

---

## 평가 작성 템플릿 (Eval Template)

### 코딩 에이전트 평가 예시

```yaml
task:
  id: "fix-auth-bypass_1"
  desc: "인증 우회 취약점 수정"

  graders:
    # 1. 코드 기반: 테스트 통과 확인
    - type: deterministic_tests
      required: [test_empty_pw_rejected.py, test_null_pw_rejected.py]

    # 2. 모델 기반: 코드 품질 평가
    - type: llm_rubric
      rubric: prompts/code_quality.md

    # 3. 코드 기반: 정적 분석
    - type: static_analysis
      commands: [ruff, mypy, bandit]

    # 4. 코드 기반: 상태 확인
    - type: state_check
      expect:
        security_logs: {event_type: "auth_blocked"}

    # 5. 코드 기반: 도구 호출 검증
    - type: tool_calls
      required:
        - {tool: read_file, params: {path: "src/auth/*"}}
        - {tool: edit_file}
        - {tool: run_tests}

  tracked_metrics:
    - type: transcript
      metrics: [n_turns, n_toolcalls, n_total_tokens]
    - type: latency
      metrics: [time_to_first_token, output_tokens_per_sec]
```

### 대화형 에이전트 평가 예시

```yaml
task:
  id: "refund-handling_1"
  desc: "불만 고객 환불 처리"

  graders:
    # 1. 모델 기반: 대화 품질
    - type: llm_rubric
      rubric: prompts/support_quality.md
      assertions:
        - "고객 불만에 공감을 표현했는가"
        - "해결책을 명확히 설명했는가"
        - "fetch_policy 도구 결과에 기반했는가"

    # 2. 코드 기반: 상태 확인
    - type: state_check
      expect:
        tickets: {status: resolved}
        refunds: {status: processed}

    # 3. 코드 기반: 도구 호출 검증
    - type: tool_calls
      required:
        - {tool: verify_identity}
        - {tool: process_refund, params: {amount: "<=100"}}
        - {tool: send_confirmation}

    # 4. 코드 기반: 트랜스크립트 제약
    - type: transcript
      max_turns: 10
```

---

## Best Practices

### 태스크 작성

1. **모호함 제거**: 두 전문가가 독립적으로 같은 판정을 내릴 수 있어야 함
2. **참조 솔루션 생성**: 태스크가 해결 가능하고 그레이더가 정확한지 증명
3. **균형 잡힌 테스트**: 행동이 일어나야 하는 경우와 일어나지 말아야 하는 경우 모두 테스트

### 그레이더 설계

1. **결정론적 우선**: 가능한 경우 코드 기반 그레이더 선택
2. **결과 중심**: 경로보다 결과를 채점 (창의적 솔루션 허용)
3. **부분 점수**: 다중 컴포넌트 태스크에 부분 점수 부여
4. **LLM 보정**: 모델 그레이더는 인간 전문가와 주기적 보정

### 유지보수

1. **트랜스크립트 검토**: 정기적으로 시도 기록 읽기
2. **포화 모니터링**: 100% 통과율 도달 시 새 태스크 추가
3. **팀 기여**: 제품 팀이 평가 태스크 기여 가능하도록

---

## Rules

1. **조기 시작**: 20-50개 태스크로 시작, 완벽한 스위트 기다리지 않음
2. **실패에서 학습**: 사용자 보고 실패를 테스트 케이스로 변환
3. **격리된 환경**: 각 시도는 깨끗한 환경에서 시작
4. **결과 검증**: 채점이 공정한지, 유효한 솔루션이 거부되지 않는지 확인
5. **정기적 읽기**: 트랜스크립트와 채점 결과 검토
