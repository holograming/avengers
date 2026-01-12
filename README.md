# Avengers - Multi-Agent Development System

Claude Code 기반 멀티 에이전트 개발 자동화 시스템입니다.

## Overview

7명의 전문 AI 에이전트가 협력하여 복잡한 개발 작업을 자동화합니다.

```
              ┌─────────────────────┐
              │      Captain        │  ← Orchestrator & Coordinator
              │  요청 분석 + 조율    │
              └──────────┬──────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───▼────┐          ┌────▼────┐          ┌────▼───┐
│ Jarvis │          │Dr.Strange│          │ Vision │
│Research│          │ Planning │          │  Docs  │
└────────┘          └──────────┘          └────────┘
         Advisory Layer (동등 레벨)
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───▼────┐          ┌────▼────┐          ┌────▼───┐
│IronMan │          │ Natasha │          │ Groot  │
│Fullstk │          │ Backend │          │  Test  │
└────────┘          └──────────┘          └────────┘
         Execution Layer
```

**M5 유연한 계층**: Captain이 요청을 분석하여 필요한 에이전트만 호출합니다.

## Features

- **유연한 워크플로우**: Research Only, Planning, Quick Fix, Full Development
- **병렬 에이전트 실행**: Background Task 기반 컨텍스트 격리
- **완료 검증 (Infinity War)**: 테스트 통과 전까지 완료 불가
- **에이전트 간 소통**: Handoff, Broadcast, Shared Context
- **상태 저장/복구**: 세션 중단 후 재개 지원

## Quick Start

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd Avengers

# 2. MCP 서버 설치
cd mcp-servers/avengers-core && npm install && npm run build
cd ../avengers-skills && npm install && npm run build

# 3. Claude Code에서 사용
claude> /assemble              # 팀 소집
claude> /mission 인증 시스템 구현  # 미션 시작
claude> /debrief               # 결과 확인
```

자세한 설치 방법은 [Installation Guide](docs/INSTALLATION.md) 참조.

## Agents

| 에이전트 | 역할 | 전문 분야 |
|---------|------|----------|
| **Captain** | Orchestrator | 요청 분석, 에이전트 조율 |
| **IronMan** | Fullstack Dev | React, Node.js, TypeScript |
| **Natasha** | Backend Dev | API, Database, 서버 로직 |
| **Groot** | Test Specialist | 테스트 작성, 품질 검증 |
| **Jarvis** | Researcher | 기술 조사, 문서 검색 |
| **Dr.Strange** | Architect | 요구사항 분석, 시스템 설계 |
| **Vision** | Documentation | 문서 작성, API 명세 |

자세한 에이전트 정보는 [Agents Guide](docs/AGENTS.md) 참조.

## Documentation

| 문서 | 설명 |
|------|------|
| [Installation](docs/INSTALLATION.md) | 설치 가이드 |
| [Workflows](docs/WORKFLOWS.md) | M5 워크플로우 상세 |
| [Agents](docs/AGENTS.md) | 에이전트 상세 |
| [Features](docs/FEATURES.md) | 기능 및 API 레퍼런스 |
| [Architecture](docs/ARCHITECTURE.md) | 시스템 아키텍처 |
| [Examples](docs/EXAMPLES.md) | 사용 예시 |
| [CLAUDE.md](CLAUDE.md) | Claude Code 통합 가이드 |

## Roadmap

- [x] **Phase 1** - 핵심 시스템 (M1-M5) 완료
- [ ] **Phase 2** - 외부 연동 (OpenCode 등)
- [ ] **Phase 3** - 확장 기능

## License

MIT License
