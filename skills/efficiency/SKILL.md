# Efficiency Skill

AI 에이전트의 토큰 효율성과 세션 관리를 최적화합니다.

## Quick Start

```typescript
// 효율적인 컨텍스트 로딩
const context = loadContext({
  priority: ["critical", "high"],
  maxTokens: 50000,
  summarize: true
})
```

---

## Overview

### 왜 효율성이 중요한가?

AI 에이전트 작업에서 효율성은 다음을 결정합니다:

1. **비용 관리**: 토큰 사용량 = 직접적인 비용
2. **응답 속도**: 컨텍스트가 작을수록 처리 속도 향상
3. **정확도**: 관련 정보만 로드하면 노이즈 감소
4. **세션 연속성**: 효율적인 상태 관리로 중단 없는 작업 가능
5. **컨텍스트 윈도우**: 제한된 토큰 내에서 최대 활용

### 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **필요한 것만 로드** | 전체 파일보다 관련 섹션만 |
| **적절한 요약** | 상세 정보가 필요 없으면 요약 사용 |
| **청크 처리** | 대용량 작업은 분할하여 처리 |
| **상태 직렬화** | 세션 간 필수 정보만 저장 |

---

## Token Saving Strategies

### 1. Context Compression (컨텍스트 압축)

불필요한 정보를 제거하고 핵심만 유지합니다.

```typescript
// Before: 전체 파일 로드 (낭비)
const fullFile = readFile("src/auth/service.ts")  // 500 lines

// After: 필요한 부분만 로드 (효율적)
const relevantSection = readFile("src/auth/service.ts", {
  startLine: 45,
  endLine: 80
})
```

**압축 기법:**

| 기법 | 적용 시점 | 예시 |
|------|----------|------|
| 라인 범위 지정 | 특정 함수/클래스만 필요할 때 | `lines: 100-150` |
| 구조만 추출 | 구현보다 API 형태가 중요할 때 | 함수 시그니처만 |
| 주석 제거 | 로직 분석이 목적일 때 | 코드만 유지 |
| 요약 생성 | 개요만 필요할 때 | 3줄 요약 |

**압축 전략 선택:**

```
상세 구현 필요? → 전체 로드
API 형태 필요? → 시그니처만
개요 필요? → 요약 생성
특정 부분 필요? → 라인 범위 지정
```

### 2. Selective Information Loading (선택적 정보 로딩)

우선순위 기반으로 필요한 정보만 로드합니다.

```typescript
const loadPriority = {
  critical: [
    "requirements.md",     // 항상 로드
    "schema.prisma"        // 데이터 모델
  ],
  high: [
    "src/types/*.ts",      // 타입 정의
    "tsconfig.json"        // 설정
  ],
  medium: [
    "src/utils/*.ts"       // 유틸리티
  ],
  low: [
    "tests/**/*.ts",       // 테스트 (필요시만)
    "docs/**/*.md"         // 문서
  ]
}
```

**로딩 전략:**

1. **Critical**: 항상 로드 (작업 수행에 필수)
2. **High**: 기본 로드 (대부분의 작업에 필요)
3. **Medium**: 조건부 로드 (특정 작업에만)
4. **Low**: 요청 시 로드 (명시적으로 필요할 때만)

### 3. Chunked Processing (청크 처리)

대용량 작업을 작은 단위로 분할합니다.

```typescript
// Anti-pattern: 한 번에 모든 파일 처리
// processAllFiles(files)  // 100개 파일 동시 처리 → 컨텍스트 초과

// Best practice: 청크 단위 처리
const chunkSize = 10
for (const chunk of chunks(files, chunkSize)) {
  const results = await processChunk(chunk)
  saveIntermediateResults(results)
}
```

**청크 처리 가이드:**

| 작업 유형 | 권장 청크 크기 | 이유 |
|----------|--------------|------|
| 파일 분석 | 5-10개 파일 | 컨텍스트 유지 가능 |
| 코드 리뷰 | 100-200 라인 | 집중력 유지 |
| 테스트 실행 | 모듈 단위 | 실패 지점 격리 |
| 리팩토링 | 함수 단위 | 원자적 변경 |

### 4. Caching Strategies (캐싱 전략)

반복 접근하는 정보를 캐시합니다.

```typescript
const cacheConfig = {
  // 불변 데이터: 장기 캐시
  immutable: {
    items: ["package.json", "tsconfig.json"],
    ttl: "session"
  },

  // 준정적 데이터: 중기 캐시
  semiStatic: {
    items: ["src/types/**"],
    ttl: "30min",
    invalidateOn: ["file-change"]
  },

  // 동적 데이터: 캐시 안함
  dynamic: {
    items: ["src/**/*.ts"],
    ttl: "none"
  }
}
```

**캐시 무효화 조건:**

- 파일 변경 감지
- 시간 초과 (TTL)
- 명시적 무효화 요청
- 세션 종료

---

## Session State Management

### 상태 직렬화 형식 (State Serialization Format)

세션 상태를 효율적으로 저장하고 복원합니다.

```yaml
# .claude/resume/latest.md
---
version: "1.0"
timestamp: "2024-01-15T10:30:00Z"
---

# Session State

## Context Summary
- 작업: 사용자 인증 시스템 구현
- 진행률: 60%
- 현재 단계: API 엔드포인트 구현 중

## Completed Tasks
- [x] 요구사항 분석
- [x] 데이터베이스 스키마 설계
- [x] 모델 구현

## Pending Tasks
- [ ] API 엔드포인트 구현 (진행 중)
- [ ] 프론트엔드 연동
- [ ] 테스트 작성

## Key Decisions
1. JWT 기반 인증 선택 (이유: stateless)
2. Redis 세션 저장소 사용
3. bcrypt로 비밀번호 해싱

## Active Files
- src/auth/jwt.service.ts (수정 중)
- src/auth/auth.controller.ts (다음)

## Last Commit
- hash: abc1234
- message: "feat: JWT 서비스 구현"
```

### Checkpoint Strategies (체크포인트 전략)

작업 중 상태를 정기적으로 저장합니다.

```typescript
const checkpointConfig = {
  // 자동 체크포인트
  auto: {
    interval: "5min",           // 시간 기반
    onMilestone: true,          // 마일스톤 완료 시
    onSignificantChange: true   // 중요 변경 시
  },

  // 수동 체크포인트
  manual: {
    command: "/checkpoint",
    includeContext: true
  },

  // 저장 위치
  storage: ".claude/resume/"
}
```

**체크포인트 타이밍:**

| 트리거 | 설명 | 저장 내용 |
|--------|------|----------|
| 마일스톤 완료 | 주요 단계 완료 시 | 전체 상태 + 요약 |
| 커밋 후 | git commit 이후 | 커밋 정보 + 다음 작업 |
| 에러 발생 | 작업 중단 시 | 에러 컨텍스트 + 복구 정보 |
| 세션 종료 | 대화 종료 시 | 전체 상태 |

### Recovery Procedures (복구 절차)

중단된 세션에서 작업을 재개합니다.

```typescript
// 세션 복구 프로세스
const recoveryProcess = {
  1: "체크포인트 로드",
  2: "상태 검증",
  3: "변경사항 확인",
  4: "컨텍스트 복원",
  5: "작업 재개"
}
```

**복구 명령:**

```bash
# 마지막 세션 상태 확인
cat .claude/resume/latest.md

# 복구 시작
# (새 세션에서 자동으로 로드되거나 수동으로 참조)
```

**복구 체크리스트:**

- [ ] 마지막 커밋 확인
- [ ] 미완료 작업 목록 확인
- [ ] 진행 중이던 파일 상태 확인
- [ ] 테스트 상태 확인
- [ ] 의존성 변경 확인

---

## Best Practices

### When to Summarize (요약 시점)

```
전체 내용 필요? → 원본 유지
개요만 필요? → 요약 생성
히스토리 참조? → 핵심만 추출
대화 길어짐? → 중간 요약 생성
```

**요약 가이드:**

| 상황 | 액션 |
|------|------|
| 100줄 이상 파일 분석 완료 | 핵심 발견사항 요약 |
| 다중 파일 조사 완료 | 관계도 + 요약 생성 |
| 긴 대화 중간 | 지금까지의 결정사항 정리 |
| 작업 전환 시 | 이전 작업 상태 요약 후 전환 |

### What to Cache (캐시 대상)

**캐시해야 할 것:**

1. 프로젝트 설정 파일 (`package.json`, `tsconfig.json`)
2. 타입 정의 파일 (`*.d.ts`, `types/*.ts`)
3. 스키마 파일 (`schema.prisma`, `*.graphql`)
4. 환경 설정 (민감 정보 제외)

**캐시하지 말 것:**

1. 자주 변경되는 소스 코드
2. 민감 정보 (`.env`, credentials)
3. 빌드 산출물 (`dist/`, `build/`)
4. 대용량 바이너리 파일

### Priority-based Context Loading (우선순위 기반 로딩)

```typescript
const contextLoadingOrder = [
  // 1단계: 필수 컨텍스트
  {
    priority: "critical",
    items: ["CLAUDE.md", "요구사항 문서"],
    action: "항상 로드"
  },

  // 2단계: 작업 관련 컨텍스트
  {
    priority: "high",
    items: ["작업 대상 파일", "관련 타입"],
    action: "작업 시작 시 로드"
  },

  // 3단계: 참조 컨텍스트
  {
    priority: "medium",
    items: ["유사 구현 예시", "테스트 파일"],
    action: "필요 시 로드"
  },

  // 4단계: 보조 컨텍스트
  {
    priority: "low",
    items: ["문서", "이전 히스토리"],
    action: "명시적 요청 시만"
  }
]
```

---

## Rules

1. **필요한 것만 로드**: 전체 파일보다 관련 섹션만 읽기
2. **요약 활용**: 상세 정보가 불필요하면 요약으로 대체
3. **청크 처리**: 대용량 작업은 분할하여 순차 처리
4. **상태 저장**: 주요 마일스톤마다 체크포인트 생성
5. **캐시 관리**: 불변 데이터는 캐시, 동적 데이터는 매번 로드
6. **우선순위 준수**: Critical > High > Medium > Low 순서로 로드
7. **복구 대비**: 언제든 세션 복구가 가능하도록 상태 유지
8. **토큰 모니터링**: 컨텍스트 사용량을 주기적으로 확인

---

## Token Budget 가이드

### 컨텍스트 할당 예시

```
전체 예산: 100,000 토큰

시스템 프롬프트:     5,000 (5%)
프로젝트 규칙:      10,000 (10%)
작업 컨텍스트:      40,000 (40%)
대화 히스토리:      25,000 (25%)
응답 버퍼:         20,000 (20%)
```

### 토큰 절약 체크리스트

- [ ] 전체 파일 대신 필요한 라인만 로드했는가?
- [ ] 이전에 분석한 내용을 요약으로 압축했는가?
- [ ] 불필요한 주석/공백이 포함되어 있지 않은가?
- [ ] 반복되는 정보가 있다면 참조로 대체했는가?
- [ ] 작업과 무관한 파일이 컨텍스트에 포함되어 있지 않은가?
