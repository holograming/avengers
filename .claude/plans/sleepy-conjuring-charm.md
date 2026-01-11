# Avengers 프로젝트 개발 로드맵

## 현재 상태 요약

### 구현 완료 (Phase 1-2 부분)
| 영역 | 상태 | 비고 |
|------|------|------|
| MCP 서버 (avengers-core) | 100% | dispatch-agent, assign-task, get-agent-status, merge-worktree |
| MCP 서버 (avengers-skills) | 100% | tdd, brainstorm, code-review |
| 7가지 에이전트 정의 | 100% | Captain, IronMan, Natasha, Groot, Jarvis, Dr.Strange, Vision |
| 슬래시 커맨드 | 100% | /mission, /assemble, /debrief |
| 스킬 문서 | 60% | TDD, 브레인스토밍, 코드 리뷰 완료 |

### 미구현 (우선순위순)
1. **평가(Evals) 시스템** - 07 문서 기반 품질 보장 체계
2. **특수 스킬** - Frontend, Backend, C++, Systematic-debugging, CI/CD
3. **토큰 절약 시스템** - 효율적 컨텍스트 관리
4. **상태 저장/복구** - 세션 연속성
5. **Ultron System** - tmux 기반 병렬 Claude
6. **OpenCode 연동** - 외부 시스템 통합

---

## 로드맵

### Milestone 1: 평가 시스템 구축 (07 문서 기반)

**목표:** AI 에이전트 평가 프레임워크 구축

**백그라운드 작업 분배:**
- **Vision (문서):** `skills/evaluation/SKILL.md` 작성
- **Groot (테스트):** `tests/evals/` 구조 및 기본 평가 5개 작성
- **Dr.Strange (설계):** 에이전트별 성공 메트릭 정의

**산출물:**
```
skills/evaluation/
├── SKILL.md              # 평가 스킬 가이드
└── templates/
    └── eval-task.yaml    # 평가 작업 템플릿

tests/evals/
├── agent-coordination/   # 에이전트 조율 평가
├── tool-usage/           # 도구 사용 평가
├── capability/           # 능력 평가
└── regression/           # 회귀 평가

docs/agent-metrics/       # 에이전트별 성공 기준
├── captain-metrics.md
├── ironman-metrics.md
├── natasha-metrics.md
├── groot-metrics.md
└── evaluation-rubrics.md
```

**핵심 개념 (07 문서 기반):**
- 3가지 그레이더: 코드 기반 > 모델 기반 > 인간 기반
- pass@k: 문제 해결 확률 / pass^k: 일관성 확률
- 능력 평가 (개선 목표) vs 회귀 평가 (보호 목표)

---

### Milestone 2: 특수 스킬 완성 (Phase 1 완료)

**목표:** 모든 에이전트가 전문 영역별 스킬 보유

**백그라운드 작업 분배:**
- **IronMan:** Frontend 스킬 정의
- **Natasha:** Backend 스킬 정의
- **Jarvis (리서치):** Systematic-debugging 스킬 조사 및 정리
- **Vision:** CI/CD 스킬 문서화

**산출물:**
```
skills/specialized/
├── frontend/
│   └── SKILL.md          # React, Vue, CSS 가이드
├── backend/
│   └── SKILL.md          # API, DB, 서버 가이드
├── cpp/
│   └── SKILL.md          # C++ 개발 가이드
├── systematic-debugging/
│   └── SKILL.md          # 체계적 디버깅 방법론
└── cicd/
    └── SKILL.md          # GitHub Actions 가이드
```

---

### Milestone 3: 효율성 시스템 (Phase 2 완료)

**목표:** 토큰 절약 및 상태 관리

**백그라운드 작업 분배:**
- **Dr.Strange (설계):** 토큰 절약 아키텍처 설계
- **IronMan:** 상태 저장/복구 구현
- **Natasha:** 세션 요약 기능 구현

**산출물:**
```
mcp-servers/avengers-core/src/tools/
├── save-state.ts         # 상태 저장
├── restore-state.ts      # 상태 복구
└── summarize-session.ts  # 세션 요약

skills/efficiency/
└── SKILL.md              # 토큰 절약 가이드
```

**핵심 기능:**
- 컨텍스트 자동 요약
- 중요 정보 캐싱
- 세션 체크포인트

---

### Milestone 4: Ultron 시스템

**목표:** tmux 기반 다중 Claude 병렬 실행

**산출물:**
```
ultron/
├── ultron.sh             # tmux 세션 관리 스크립트
├── agent-launcher.ts     # 에이전트 실행기
├── message-broker.ts     # 에이전트 간 메시지 브로커
└── README.md
```

---

### Milestone 5: 외부 연동 (Phase 3)

**목표:** OpenCode 등 외부 시스템 연동

**산출물:**
```
integrations/
├── opencode/
│   └── adapter.ts        # OpenCode 어댑터
└── README.md
```

---

## 병렬 작업 전략

### 작업 분리 원칙
1. **메인 세션:** 조율 및 리뷰만 수행 (컨텍스트 오염 최소화)
2. **백그라운드 에이전트:** 실제 구현 작업 수행
3. **Worktree 분리:** 각 Milestone별 독립 브랜치

### 에이전트별 역할

| 에이전트 | Milestone 1 | Milestone 2 | Milestone 3 |
|---------|-------------|-------------|-------------|
| Captain | 조율 | 조율 | 조율 |
| IronMan | - | Frontend 스킬 | 상태 저장/복구 |
| Natasha | - | Backend 스킬 | 세션 요약 |
| Groot | 평가 작성 | - | - |
| Jarvis | - | 디버깅 스킬 조사 | - |
| Dr.Strange | 메트릭 정의 | - | 토큰 절약 설계 |
| Vision | 평가 SKILL.md | CI/CD 스킬 | - |

---

## 검증 방법

### Milestone 1 완료 기준
- [ ] `skills/evaluation/SKILL.md` 존재
- [ ] `tests/evals/` 내 5개 이상 평가 파일 존재
- [ ] 각 에이전트별 메트릭 문서 존재
- [ ] `npm test` 평가 실행 가능

### Milestone 2 완료 기준
- [ ] 5개 특수 스킬 SKILL.md 완성
- [ ] MCP 도구로 스킬 호출 가능 (선택)

### Milestone 3 완료 기준
- [ ] 상태 저장/복구 도구 동작
- [ ] 세션 요약 기능 동작
- [ ] 토큰 사용량 20% 이상 감소

---

## 다음 단계 (즉시 실행) - 고병렬 모드

**Milestone 1 시작 (4개 에이전트 병렬 실행):**

1. **Vision 에이전트 디스패치** (백그라운드)
   - 작업: `skills/evaluation/SKILL.md` 작성
   - Worktree: `worktree/vision-M1-eval-skill`

2. **Groot 에이전트 디스패치** (백그라운드)
   - 작업: `tests/evals/` 기본 평가 5개 작성
   - Worktree: `worktree/groot-M1-evals`

3. **Dr.Strange 에이전트 디스패치** (백그라운드)
   - 작업: 에이전트별 성공 메트릭 정의
   - Worktree: `worktree/strange-M1-metrics`

4. **Jarvis 에이전트 디스패치** (백그라운드)
   - 작업: 07 문서 기반 Best Practices 조사 및 정리
   - Worktree: `worktree/jarvis-M1-research`

**실행 명령:**
```typescript
// 병렬 에이전트 디스패치 (고병렬 - 4개 동시)
avengers_dispatch_agent({ agent: "vision", task: "평가 스킬 문서 작성 (skills/evaluation/SKILL.md)", worktree: true, priority: "high" })
avengers_dispatch_agent({ agent: "groot", task: "기본 평가 5개 작성 (tests/evals/)", worktree: true, priority: "high" })
avengers_dispatch_agent({ agent: "dr-strange", task: "에이전트별 메트릭 정의 (docs/agent-metrics/)", worktree: true, priority: "high" })
avengers_dispatch_agent({ agent: "jarvis", task: "07 문서 기반 Best Practices 조사", worktree: true, priority: "medium" })
```

**병합 순서:**
1. Jarvis 리서치 결과 먼저 리뷰 (다른 작업에 반영)
2. Vision, Groot, Dr.Strange 결과 병합
3. Captain이 전체 통합 리뷰

---

## 참고: 07 문서 핵심 적용 사항

### 평가 프레임워크 구조
```yaml
평가(Eval):
  ├── 작업(Task): 정의된 입력과 성공 기준
  ├── 시도(Trial): 각 시도 (비결정성 대비)
  ├── 그레이더(Grader): 채점 로직
  │   ├── 코드 기반: 빠름, 객관적
  │   ├── 모델 기반: 유연함, 미묘함 포착
  │   └── 인간 기반: 황금 표준
  ├── 트랜스크립트: 상호작용 기록
  ├── 결과: 최종 상태
  └── 평가 스위트: 작업 모음
```

### 비결정성 처리
- **pass@k:** k번 중 1회 이상 성공 확률 (문제 해결 목표)
- **pass^k:** k번 모두 성공 확률 (일관성 목표)

### 평가 유형
- **능력 평가:** 개선 목표 (낮은 통과율에서 시작)
- **회귀 평가:** 보호 목표 (~100% 유지)
