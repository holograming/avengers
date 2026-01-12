# Installation Guide

Avengers 멀티 에이전트 시스템 설치 가이드입니다.

## Prerequisites

- **Node.js**: 18.0.0 이상
- **npm**: 9.0.0 이상
- **Git**: 2.30.0 이상
- **Claude Code CLI**: 설치 및 인증 완료

## Step 1: 프로젝트 클론

```bash
git clone <repository-url>
cd Avengers
```

## Step 2: MCP 서버 설치

### Core 서버 (필수)

```bash
cd mcp-servers/avengers-core
npm install
npm run build
```

### Skills 서버 (필수)

```bash
cd ../avengers-skills
npm install
npm run build
```

### 설치 확인

```bash
# Core 서버 테스트
cd mcp-servers/avengers-core
npm test

# 예상 결과: 39개 테스트 통과
```

## Step 3: Claude Code 설정

`.claude/settings.json` 파일에 MCP 서버를 등록합니다:

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

## Step 4: 설치 확인

Claude Code를 실행하여 MCP 도구가 등록되었는지 확인합니다:

```bash
claude

# Claude 내에서 다음 명령어로 확인
/tools
```

다음 도구들이 목록에 표시되어야 합니다:
- `avengers_dispatch_agent`
- `avengers_get_agent_status`
- `avengers_assign_task`
- `avengers_skill_tdd`
- 등...

## Troubleshooting

### MCP 서버가 시작되지 않는 경우

```bash
# TypeScript 런타임 확인
npx tsx --version

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

### 도구가 표시되지 않는 경우

1. `.claude/settings.json` 경로 확인
2. Claude Code 재시작
3. MCP 서버 로그 확인:

```bash
# 디버그 모드로 서버 실행
DEBUG=* npx tsx mcp-servers/avengers-core/src/index.ts
```

## 다음 단계

- [Quick Start](../README.md#quick-start) - 빠른 시작
- [Workflows](./WORKFLOWS.md) - 워크플로우 가이드
- [API Reference](./FEATURES.md#mcp-tools-api-reference) - 도구 레퍼런스
