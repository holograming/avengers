# Architecture

Avengers 시스템의 아키텍처와 디렉토리 구조입니다.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Code CLI                         │
│                    (User Interface Layer)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Protocol Layer                        │
│         (Model Context Protocol Communication)               │
└───────────┬─────────────────────────────────┬───────────────┘
            │                                 │
            ▼                                 ▼
┌───────────────────────┐       ┌───────────────────────────┐
│    avengers-core      │       │     avengers-skills       │
│   (14개 Core Tools)   │       │    (3개 Skill Tools)      │
├───────────────────────┤       ├───────────────────────────┤
│ • dispatch_agent      │       │ • skill_tdd               │
│ • analyze_request     │       │ • skill_brainstorm        │
│ • validate_completion │       │ • skill_code_review       │
│ • agent_communicate   │       │                           │
│ • assign_task         │       │                           │
│ • merge_worktree      │       │                           │
│ • save/restore_state  │       │                           │
│ • collect_results     │       │                           │
└───────────────────────┘       └───────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Git Worktree Layer                        │
│            (Agent Isolation & Parallel Work)                 │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
Avengers/
├── .claude/
│   ├── commands/           # 슬래시 커맨드 (/mission, /assemble, /debrief)
│   │   ├── mission.md      # 새 미션 시작
│   │   ├── assemble.md     # 에이전트 팀 소집
│   │   └── debrief.md      # 미션 결과 정리
│   │
│   ├── plans/              # 로드맵 및 계획 파일
│   │   └── *.md            # 현재 진행 중인 계획들
│   │
│   ├── resume/             # 세션 복구 정보
│   │   └── latest.md       # 마지막 세션 상태
│   │
│   ├── state/              # 상태 저장 파일
│   │   └── *.json          # 저장된 세션 상태
│   │
│   └── designs/            # 아키텍처 설계 문서
│       └── *.md            # 설계 결정 기록
│
├── mcp-servers/
│   ├── avengers-core/      # 핵심 MCP 서버
│   │   ├── src/
│   │   │   ├── index.ts            # 서버 엔트리포인트
│   │   │   ├── agent-templates.ts  # 에이전트 프롬프트 템플릿
│   │   │   └── tools/              # 14개 도구 구현
│   │   │       ├── dispatch-agent.ts
│   │   │       ├── analyze-request.ts       # M5
│   │   │       ├── validate-completion.ts   # M5
│   │   │       ├── agent-communication.ts   # M5
│   │   │       ├── assign-task.ts
│   │   │       ├── merge-worktree.ts
│   │   │       ├── save-state.ts
│   │   │       ├── restore-state.ts
│   │   │       ├── summarize-session.ts
│   │   │       ├── collect-results.ts
│   │   │       └── get-agent-status.ts
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── avengers-skills/    # 스킬 MCP 서버
│       ├── src/
│       │   ├── index.ts
│       │   └── skills/
│       │       ├── tdd.ts
│       │       ├── brainstorm.ts
│       │       └── code-review.ts
│       └── package.json
│
├── skills/
│   ├── evaluation/         # 평가 프레임워크 (M1)
│   │   └── SKILL.md
│   │
│   ├── specialized/        # 전문 스킬 (M2)
│   │   ├── frontend/
│   │   │   └── SKILL.md
│   │   ├── backend/
│   │   │   └── SKILL.md
│   │   ├── systematic-debugging/
│   │   │   └── SKILL.md
│   │   └── cicd/
│   │       └── SKILL.md
│   │
│   ├── efficiency/         # 효율성 스킬 (M3)
│   │   └── SKILL.md
│   │
│   └── parallel-agents/    # 병렬 에이전트 패턴 (M4)
│       └── SKILL.md
│
├── tests/
│   └── evals/              # 에이전트 평가 테스트
│       ├── agent-coordination/
│       ├── tool-usage/
│       ├── capability/
│       └── regression/
│
├── docs/                   # 상세 문서
│   ├── FEATURES.md         # 기능 상세 설명
│   ├── INSTALLATION.md     # 설치 가이드
│   ├── AGENTS.md           # 에이전트 상세
│   ├── ARCHITECTURE.md     # 이 파일
│   ├── WORKFLOWS.md        # 워크플로우 가이드
│   └── EXAMPLES.md         # 사용 예시
│
├── worktree/               # Git Worktree 작업 공간 (동적 생성)
│   ├── ironman-T001/       # IronMan의 독립 작업 공간
│   ├── natasha-T002/       # Natasha의 독립 작업 공간
│   └── groot-T003/         # Groot의 테스트 작업 공간
│
├── CLAUDE.md               # Claude Code 통합 가이드
├── README.md               # 프로젝트 개요
└── package.json
```

## Milestone Architecture

| Milestone | 영역 | 핵심 컴포넌트 |
|-----------|------|--------------|
| **M1** | 평가 시스템 | skills/evaluation/, tests/evals/ |
| **M2** | 특수 스킬 | skills/specialized/ |
| **M3** | 효율성 | save-state, restore-state, summarize-session |
| **M4** | 병렬 에이전트 | dispatch-agent, collect-results, worktree/ |
| **M5** | 워크플로우 | analyze-request, validate-completion, agent-communication |

## Data Flow

### Mission Workflow

```
User Request
    │
    ▼
┌─────────────────┐
│ analyze_request │ ← Captain 판단
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Research   Full Dev
Only       Workflow
    │         │
    ▼         ▼
Jarvis    Phase 1-7
    │         │
    ▼         ▼
Response   validate_
           completion
              │
              ▼
           Merge
```

## Related Documents

- [FEATURES.md](./FEATURES.md) - 기능 상세
- [WORKFLOWS.md](./WORKFLOWS.md) - 워크플로우 상세
- [CLAUDE.md](../CLAUDE.md) - Claude Code 통합
