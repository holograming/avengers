# Avengers - Multi-Agent Development System

Claude Code 기반 멀티 에이전트 개발 자동화 시스템입니다.

## Overview

Avengers는 7명의 전문 AI 에이전트가 협력하여 복잡한 개발 작업을 자동화하는 시스템입니다. Claude Code의 Background Task와 MCP(Model Context Protocol)를 활용하여 병렬 작업과 컨텍스트 격리를 지원합니다.

```
                    ┌─────────────┐
                    │   Captain   │  ← Orchestrator
                    │  (조율자)    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌─────▼─────┐      ┌────▼────┐
   │ IronMan │       │  Natasha  │      │  Groot  │
   │(풀스택) │       │ (백엔드)  │      │(테스트) │
   └─────────┘       └───────────┘      └─────────┘
        │                  │                  │
        │            ┌─────┴─────┐            │
        │            │           │            │
   ┌────▼────┐  ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
   │ Jarvis  │  │Dr.Strange│ │ Vision  │ │  Tests  │
   │(리서치) │  │ (설계)  │ │ (문서)  │ │         │
   └─────────┘  └─────────┘ └─────────┘ └─────────┘
```

## Features

### Phase 1 완료 기능 (M1-M4)

| Milestone | 설명 | 핵심 기능 |
|-----------|------|----------|
| **M1: 평가 시스템** | AI 에이전트 평가 프레임워크 | pass@k/pass^k 메트릭, 3종 그레이더 |
| **M2: 특수 스킬** | 영역별 전문 스킬 | Frontend, Backend, Debugging, CI/CD |
| **M3: 효율성 시스템** | 토큰 절약 및 상태 관리 | 세션 저장/복구, 자동 요약 |
| **M4: 병렬 에이전트** | Background Task 기반 병렬 실행 | 컨텍스트 격리, 결과 집계 |

## Installation

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd Avengers
```

### 2. MCP 서버 설치

```bash
# Core 서버 설치
cd mcp-servers/avengers-core
npm install
npm run build

# Skills 서버 설치
cd ../avengers-skills
npm install
npm run build
```

### 3. Claude Code 설정

`.claude/settings.json`에 MCP 서버 등록:

```json
{
  "mcpServers": {
    "avengers-core": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "mcp-servers/avengers-core/src/index.ts"]
    },
    "avengers-skills": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "mcp-servers/avengers-skills/src/index.ts"]
    }
  }
}
```

## Quick Start

### 1. 에이전트 팀 소집

```bash
claude> /assemble
```

### 2. 미션 시작

```bash
claude> /mission 사용자 인증 시스템 구현
```

### 3. 결과 확인

```bash
claude> /debrief
```

## MCP Tools Reference

### avengers-core

| 도구 | 설명 |
|------|------|
| `avengers_dispatch_agent` | 에이전트 디스패치 (병렬 실행 지원) |
| `avengers_get_agent_status` | 에이전트 상태 조회 |
| `avengers_assign_task` | 작업 할당 및 의존성 관리 |
| `avengers_merge_worktree` | Git worktree 병합 |
| `avengers_collect_results` | 백그라운드 작업 결과 집계 |
| `avengers_save_state` | 세션 상태 저장 |
| `avengers_restore_state` | 세션 상태 복구 |
| `avengers_summarize_session` | 세션 요약 생성 |

### avengers-skills

| 도구 | 설명 |
|------|------|
| `avengers_skill_tdd` | TDD 워크플로우 (RED-GREEN-REFACTOR) |
| `avengers_skill_brainstorm` | 구조화된 브레인스토밍 |
| `avengers_skill_code_review` | 체계적 코드 리뷰 |

## Agents

| 에이전트 | 역할 | 전문 분야 |
|---------|------|----------|
| **Captain** | Orchestrator | 작업 분석, 할당, 조율 |
| **IronMan** | Fullstack Dev | React, Node.js, TypeScript |
| **Natasha** | Backend Dev | API, Database, 서버 로직 |
| **Groot** | Test Specialist | 테스트 작성, 품질 검증 |
| **Jarvis** | Researcher | 기술 조사, 문서 검색 |
| **Dr.Strange** | Architect | 요구사항 분석, 시스템 설계 |
| **Vision** | Documentation | 문서 작성, API 명세 |

## Directory Structure

```
Avengers/
├── .claude/
│   ├── commands/           # 슬래시 커맨드 (/mission, /assemble, /debrief)
│   ├── plans/              # 로드맵 및 계획 파일
│   ├── resume/             # 세션 복구 정보
│   └── designs/            # 아키텍처 설계 문서
│
├── mcp-servers/
│   ├── avengers-core/      # 핵심 MCP 서버 (8개 도구)
│   └── avengers-skills/    # 스킬 MCP 서버 (3개 도구)
│
├── skills/
│   ├── evaluation/         # 평가 프레임워크 (M1)
│   ├── specialized/        # 전문 스킬 (M2)
│   │   ├── frontend/
│   │   ├── backend/
│   │   ├── systematic-debugging/
│   │   └── cicd/
│   ├── efficiency/         # 효율성 스킬 (M3)
│   └── parallel-agents/    # 병렬 에이전트 패턴 (M4)
│
├── tests/
│   └── evals/              # 에이전트 평가 테스트
│
├── docs/                   # 상세 문서
│   └── FEATURES.md         # 기능 상세 설명
│
├── CLAUDE.md               # Claude Code 지시 문서
└── README.md               # 이 파일
```

## Usage Examples

### 병렬 작업 실행

```typescript
// 1. 두 에이전트에게 동시에 작업 할당
avengers_dispatch_agent({
  agent: "ironman",
  task: "프론트엔드 구현",
  worktree: true,
  context: {
    files: ["src/components/Login.tsx"],
    references: ["https://react.dev"]
  }
})

avengers_dispatch_agent({
  agent: "natasha",
  task: "API 구현",
  worktree: true,
  context: {
    files: ["src/api/auth.ts"]
  }
})

// 2. 결과 수집
avengers_collect_results({
  taskIds: ["T001", "T002"],
  format: "summary"
})
```

### 상태 저장 및 복구

```typescript
// 세션 종료 전 상태 저장
avengers_save_state({
  key: "feature-auth",
  includeAgents: true,
  includeTasks: true
})

// 다음 세션에서 복구
avengers_restore_state({
  key: "feature-auth"
})
```

## Testing

```bash
cd mcp-servers/avengers-core
npm test

# 39개 테스트 실행 (8 효율성 + 31 병렬)
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Claude Code 통합 가이드
- [docs/FEATURES.md](./docs/FEATURES.md) - 기능 상세 문서
- [skills/*/SKILL.md](./skills/) - 각 스킬별 가이드

## Roadmap

- [x] **Phase 1** - 핵심 시스템 (M1-M4) 완료
- [ ] **Phase 2** - 외부 연동 (OpenCode 등)
- [ ] **Phase 3** - 확장 기능

## License

MIT License
