# Avengers

> 🦾 AI-Avengers 팀이 복잡한 개발 작업을 자동으로 끝까지 완성합니다

![Status](https://img.shields.io/badge/status-active-success)
![Phase](https://img.shields.io/badge/M1~M5-complete-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

# 🚀 Features

## 🎯 Infinity War Policy: 성공할 때까지 자동 재시도

**"We're in the endgame now"** — Dr.Strange, *Avengers: Infinity War*

모든 태스크 완료를 자동으로 검증하고 모든 테스트가 통과할 때까지 재시도합니다.

Avengers는 `avengers_validate_completion()`으로 테스트 결과를 체크하고 기준을 충족할 때까지 자동 루프합니다.

```typescript
// 태스크 완료 검증
avengers_validate_completion({
  taskId: "T001",
  testResults: { pass: 15, fail: 0 },
  strictness: "moderate"  // 엄격함 수준
})
```

**7명의 전문 에이전트가 협업하여 끝날 때까지 전체 개발 사이클을 자동으로 완성합니다.**

## ⏱️ Second Chance Policy: 세션 상태 복구

**"No amount of money ever bought a second of time."** — Tony Stark, *Avengers: Endgame*

작업 상태를 저장하고 복구하여 세션 중단 후 계속 진행할 수 있습니다.

`avengers_save_state()`와 `avengers_restore_state()`로 세션 데이터를 관리합니다.

```typescript
// 작업 상태 저장
avengers_save_state({
  key: "feature-auth",
  includeAgents: true,
  includeTasks: true
})

// 다음 세션에서 복구
avengers_restore_state({ key: "feature-auth" })
```

**구현 상태**:
- ✅ `avengers_save_state()` - 수동 상태 저장
- ✅ `avengers_restore_state()` - 세션 복구
- ⏳ **계획**: 자동 저장 (10분마다) 구현 예정

## 🔀 Time Heist Policy: 병렬 에이전트 실행

**"Split up. One team goes to New York, one team goes to Asgard, one team goes to Morag."** — Steve Rogers, *Avengers: Endgame*

독립적인 작업을 Worktree에서 병렬로 실행하여 여러 에이전트가 동시에 작업합니다.

각 에이전트는 격리된 Git Worktree에서 작업하고, `avengers_dispatch_agent()`로 병렬 실행합니다.

```typescript
// 에이전트 1: Natasha - 백엔드
avengers_dispatch_agent({
  agent: "natasha",
  task: "사용자 인증 API 구현",
  worktree: true  // 새 worktree 생성
})

// 에이전트 2: IronMan - 프론트엔드 (동시 진행)
avengers_dispatch_agent({
  agent: "ironman",
  task: "로그인 폼 컴포넌트 구현",
  worktree: true
})
```

**구현 상태**:
- ✅ `avengers_dispatch_agent()` - 에이전트 디스패치
- ⚠️ **기본**: Worktree 생성 (cleanup 메커니즘 필요)
- ✅ 병렬 작업 기본 지원


## 🎯 Token-Efficient MCP System: 최소 토큰, 최대 효율

**"Perfectly balanced, as all things should be."** — Thanos, *Avengers: Infinity War*

17개의 MCP 도구로 최소 토큰을 사용하면서 최대 효율을 달성합니다.

**구현된 MCP 도구** (17개):
- **avengers-core** (14개): 요청 분석, 에이전트 디스패치, 상태 관리
- **avengers-skills** (3개): TDD 워크플로우, 브레인스토밍, 코드 리뷰

**최적화 전략**:
```typescript
// 1. Context 압축 — 필요한 정보만 전달
avengers_analyze_request({
  request: "사용자 요청",
  forceResearch: true  // 공유 컨텍스트로 중복 호출 방지
})

// 2. Tool 재사용 — 에이전트 간 컨텍스트 공유
avengers_update_shared_context({
  taskId: "T001",
  agent: "natasha",
  files: ["src/api.ts"],
  summary: "API 구현 완료"  // 다른 에이전트가 참조
})

// 3. Lazy Loading — 필요할 때만 로드
avengers_dispatch_agent({
  agent: "jarvis",
  task: "리서치만 수행"  // 필요한 에이전트만 호출
})
```

**증거**: `mcp-servers/` 디렉토리의 모든 도구 구현


## 🛡️ Avengers Protocol: 명확한 협업 규칙

**"There was an idea... to bring together a group of remarkable people."** — Nick Fury, *The Avengers*

모든 협업 규칙이 정책 문서로 문서화되어 있습니다.

**정책 가이드라인** (개발 권장사항):
- [Shared Context](.claude/policies/shared-context-policy.md) — 에이전트 간 정보 공유
- [Task](.claude/policies/task-policy.md) — 작업 생성 및 관리
- [Logging](.claude/policies/logging-policy.md) — 이벤트 로깅
- [Recovery](.claude/policies/recovery-policy.md) — 상태 복구 전략

⚠️ **주의**: 정책 문서는 권장 가이드라인이며, 코드로 강제되지 않습니다. 실행은 각 에이전트의 구현에 따릅니다.

[정책 개요 →](.claude/policies/README.md)

---

## 📊 구현 상태

| 기능 | 상태 | 증거 |
|------|------|------|
| **MCP Tools** (17개) | ✅ 구현됨 | `mcp-servers/avengers-core/src/tools/` |
| **Agent Templates** (7개) | ✅ 구현됨 | `mcp-servers/avengers-core/src/agent-templates.ts` |
| **Slash Commands** (3개) | ✅ 구현됨 | `.claude/commands/` |
| **TDD Workflow** | ✅ 구현됨 | `avengers_skill_tdd` |
| **상태 저장/복구** | ✅ 구현됨 | `avengers_save_state()`, `avengers_restore_state()` |
| **Worktree 병렬 작업** | ⚠️ 기본 | `git worktree add` (cleanup 메커니즘 필요) |
| **자동 상태 저장** | ⏳ 계획됨 | 현재 수동 호출만 지원 |
| **로깅 인프라** | ⏳ 계획됨 | 현재 in-memory JSON만 지원 |
| **4계층 복구** | ⏳ 계획됨 | 현재 단일 restore 함수 |

---

### 차별화 포인트

| 기능 | 일반 AI 도구 | Avengers |
|------|-------------|---------|
| 작업 분석 | 수동 | ✅ 자동 (Captain) |
| 워크플로우 | 고정 | ✅ 유연 (M5) |
| 병렬 작업 | 불가 | ✅ Worktree 기반 |
| 복구 | 없음 | ✅ Infinity War |
| 정책 운영 | 없음 | ✅ 4개 정책 |

---

## ⚡ Quick Start

```bash
# 1. 프로젝트에 Avengers 추가
npm install @avengers/core

# 2. 미션 시작
/mission "로그인 기능 구현"

# 3. 결과 확인
/debrief
```

**2시간 만에 완성** (순차 작업 시 5시간 소요)

[상세 설치 가이드 →](docs/INSTALLATION.md)

---

## 🦸 Meet the Team

```
       Captain (오케스트레이터)
            ↓
    ┌───────┼───────┐
 Jarvis  Dr.Strange  Vision
(리서치)  (기획)    (문서)
    └───────┼───────┘
    ┌───────┼───────┐
 IronMan  Natasha  Groot
(풀스택)  (백엔드) (테스트)
```

각 에이전트는 전문 분야에서 자율적으로 작업합니다.

[에이전트 상세 →](docs/AGENTS.md)

---

## 📚 Documentation

| 문서 | 설명 |
|------|------|
| [INSTALLATION.md](docs/INSTALLATION.md) | 설치 및 설정 |
| [WORKFLOWS.md](docs/WORKFLOWS.md) | M5 워크플로우 상세 |
| [AGENTS.md](docs/AGENTS.md) | 에이전트 역할 |
| [FEATURES.md](docs/FEATURES.md) | 기능 레퍼런스 |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 시스템 아키텍처 |
| [EXAMPLES.md](docs/EXAMPLES.md) | 사용 예시 |
| [CLAUDE.md](CLAUDE.md) | Claude Code 통합 |

---

## 📊 Project Status

- ✅ **Phase 1**: M1-M5 Core System
- 🔄 **Phase 2**: External Integration
- ⏳ **Phase 3**: Advanced Features

---

## 🤝 Contributing

Contributions welcome! [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT — [LICENSE](LICENSE)
