---
disable-model-invocation: false
---

# Avengers Assemble

어벤져스를 소집하여 문제를 해결합니다.

**"There was an idea... to bring together a group of remarkable people."** — Nick Fury

## 실행 워크플로우

### Phase 0: 요청 분석 (Captain) - 즉시 실행

**첫 번째 단계: `avengers_analyze_request` 호출로 즉시 분석 시작**

```typescript
avengers_analyze_request({
  request: "$ARGUMENTS",
  forceResearch: true,
  executionMode: "auto"  // 자동 모드로 워크플로우 자동 결정
})
```

분석 결과에 따라 즉시 적절한 워크플로우 자동 선택:

### 조건부 워크플로우 (자동 실행)

분석 결과의 `mode` 필드에 따라 즉시 에이전트 디스패치:

**mode: "planning"** (Research/Planning 요청)
```
Jarvis → Dr.Strange → Captain → 즉시 응답 완료
(사용자 질문 없음. Reasonable defaults로 진행)
```

**mode: "execution"** (Development 요청)
```
Phase 1: Jarvis 리서치 (병렬)
Phase 2-3: Dr.Strange 전략 수립 (병렬)
Phase 4: Captain 작업 분배 (병렬)
Phase 5-8: IronMan/Natasha/Groot 병렬 실행
→ 끝날 때까지 계속 시도 (Infinity War 원칙)
```

### 핵심 원칙: Infinity War (끝날 때까지 끝나지 않음)

- ✅ **즉시 실행**: 분석 후 바로 에이전트 디스패치
- ✅ **자동 추론**: Reasonable defaults로 부족한 정보 자동 보충
- ✅ **최소 질문**: 불가능한 경우에만 사용자에게 질문
- ✅ **끝까지 진행**: 테스트 통과/검증 완료까지 멈추지 않음
- ✅ **병렬 작업**: 독립적 작업은 동시에 진행 (Worktree)

## Full Development 워크플로우 (실제 Infinity War 구현)

### ⚙️ 자동 실행 엔진 (Stop 없음)

```
[Phase 0: 분석]
    ↓ (실패 시 재시도)
[Phase 1: 리서치 (Jarvis)]
    ↓ (실패 시 재시도)
[Phase 2-3: 기획 (Captain + Dr.Strange)]
    ↓ (실패 시 재시도)
[Phase 4: 작업 분배 (Captain)]
    ↓ (실패 시 재시도)
[Phase 5: 병렬 개발 (IronMan/Natasha/Groot)]
    ↓ (실패 시 재시도)
[Phase 6: 테스트 실행 (Groot)]
    ├─ 실패? → 버그 분석 → Phase 5로 돌아가서 수정 → 다시 Phase 6
    └─ 성공? → 다음 단계
    ↓
[Phase 6.5: 빌드 검증 (Groot/IronMan)]
    ├─ 실패? → 에러 분석 → Phase 5로 돌아가서 수정 → 다시 빌드
    └─ 성공? → 다음 단계
    ↓
[Phase 7: 문서화 (Vision)]
    ├─ 실패? → 다시 시도
    └─ 성공? → 다음 단계
    ↓
[Phase 8: CI/CD (Hawkeye)]
    └─ 완료 기준에 따라 자동 실행
```

### Phase 1: 정보 수집 (Jarvis)

Jarvis 호출 → 리서치 완료까지 계속 시도:

```
avengers_dispatch_agent({
  agent: "jarvis",
  task: "리서치: $ARGUMENTS",
  mode: "foreground"
})
→ 완료될 때까지 대기
→ 실패 시 자동 재시도
```

### Phase 2-3: 기획 + 검증 평가 (Captain + Dr.Strange)

리서치 결과 기반으로 기획 → **평가 시스템으로 품질 검증**:

#### 2-3-1. 기획 생성
```
Reasonable Defaults 자동 적용:
- 기술 스택: 요청 분석으로부터 자동 선택
- 범위: 요청 구체성으로 판단 (MVP/중간/완전)
- 데이터베이스: 프로젝트 타입별 기본값 선택
- 인증: 자동 필요성 판단
- 배포: 완료 기준 자동 결정
```

#### 2-3-2. 기획 평가 시스템 (100점 만점)

```
평가 기준:

1️⃣ 명확성 (Clarity) - 25점
   - 모든 컴포넌트 명시적으로 정의: 15점
   - 의존성 관계 명확: 10점

2️⃣ 완성도 (Completeness) - 25점
   - 모든 필수 기능 포함: 15점
   - 엣지 케이스 고려: 10점

3️⃣ 실현 가능성 (Feasibility) - 25점
   - 기술적으로 구현 가능: 15점
   - 현실적인 일정/리소스: 10점

4️⃣ 품질 (Quality) - 25점
   - 아키텍처 설계 우수: 15점
   - 확장성/유지보수성: 10점

합격 기준: 70점 이상
```

#### 2-3-3. 검증 과제 (Validation Tasks)

```
기획이 70점 미만이면 다음 과제 수행 후 재평가:

과제 1: 요구사항 명확화
  - 각 기능의 정확한 스펙 정의
  - 입출력 형식 명시

과제 2: 의존성 분석
  - 컴포넌트 간 의존성 그래프 작성
  - 순환 의존성 제거

과제 3: 리스크 분석
  - 기술적 리스크 식별
  - 완화 전략 수립

과제 4: 리소스 계획
  - 필요 에이전트 명시
  - 예상 시간 재평가

→ 모든 과제 완료 후 재평가
→ 70점 이상 달성까지 반복
```

#### 2-3-4. 기획 최종 검증

```
합격 기준:
✅ 평가 점수 70점 이상
✅ 모든 검증 과제 완료
✅ 아키텍처 문서 생성
✅ Phase 4로 진행 가능한 명확한 작업 분해

불합격 시:
❌ 검증 과제 수행 후 재평가
❌ 최대 3회 재평가 (포기하지 않음)
❌ 3회 이후에도 70점 미달이면 완화된 기준(60점)으로 진행
```

### Phase 4: 작업 분배 (Captain)

```
for each task in planned_tasks:
  avengers_assign_task({ ... })
  avengers_dispatch_agent({
    agent: assignee,
    worktree: true,
    mode: "background"
  })
→ 모든 에이전트 병렬 실행 시작
```

### Phase 5: 병렬 개발 (IronMan/Natasha/Groot)

각 에이전트 **독립적으로** TDD 기반 개발:

```
각 워크트리에서 동시 진행:
  1. Groot: 테스트 작성 (RED)
  2. IronMan/Natasha: 구현 (GREEN)
  3. Groot: 통과 확인 (REFACTOR)

→ 모든 작업 완료까지 대기
```

### Phase 5-Review: 코드 리뷰 검증 (IronMan/Natasha/Groot)

**모든 구현 코드는 리뷰 통과 후 다음 단계로 진행**:

```typescript
// 코드 리뷰 검증
avengers_validate_code_review({
  taskIds: ["T001", "T002", ...],
  reviewCriteria: {
    codeQuality: true,
    architectureCompliance: true,
    securityReview: true,
    testability: true,
    documentation: true
  },
  maxRetries: 3  // 최대 3회 리뷰 피드백
})
```

**리뷰 기준:**

1️⃣ **코드 품질 (Code Quality)** - 필수
   - 가독성 및 유지보수성
   - 명확한 함수/변수 이름
   - 복잡도 체크

2️⃣ **아키텍처 준수 (Architecture Compliance)** - 필수
   - 기획된 설계 준수
   - 계층 구조 정확성
   - 의존성 방향 준수

3️⃣ **보안 검토 (Security Review)** - 필수
   - SQL injection 방지
   - XSS 방지
   - CSRF 토큰 적용
   - 인증/인가 검증

4️⃣ **테스트 가능성 (Testability)** - 권장
   - 단위 테스트 작성 가능성
   - Mock 객체 사용 가능성
   - 통합 테스트 용이성

5️⃣ **문서화 (Documentation)** - 권장
   - 공개 API 문서화
   - 복잡한 로직 설명
   - 사용 예시

**리뷰 결과:**

- ✅ **통과**: 모든 필수 기준 충족 → Phase 6으로 진행
- ❌ **실패**: 문제점 지적 → Phase 5로 복귀하여 수정 → 재리뷰 (최대 3회)
- ❌ **3회 실패 후**: 주요 문제만 수정하고 진행 (추후 리팩토링 예정)

**핵심: 코드 품질을 먼저 확보한 후 테스트/빌드 진행**

### Phase 6: 테스트 실행 (Groot) - **5회 재시도 정책**

**모든 테스트가 통과할 때까지 최대 5회 시도**:

```typescript
// 실제 테스트 실행
avengers_run_tests({
  taskId: "T001",
  projectPath: "./",
  testType: "all",           // unit + integration
  coverage: true,
  maxRetries: 5
})
```

**테스트 실행 절차:**

**Attempt 1-5:**
1. 프로젝트 테스트 환경 준비
2. 모든 단위 테스트 실행
3. 통합 테스트 실행
4. 테스트 커버리지 측정 (목표: 80% 이상)
5. 결과 검증

**결과 분석:**

- ✅ **모든 테스트 통과**: Phase 6.5로 진행
- ❌ **테스트 실패 (Attempt < 5)**:
  ```
  버그 분석 (Groot)
    → 문제점 지적
    → IronMan/Natasha에게 수정 요청
    → Phase 5로 복귀하여 수정
    → 다시 Phase 6 테스트 실행 (재시도 +1)
  ```
- ⚠️ **5회 재시도 후에도 실패**:
  ```
  1. 우선순위 분류
     - 치명적 버그: 계속 수정
     - 낮은 우선순위 버그: 추후 이슈로 등록
  2. 통과 커버리지 재계산 (50% 이상 필수)
  3. Phase 6.5로 진행 (중요: 절대 포기하지 않음)
  ```

**성공 기준:**

| 기준 | 필수 | 권장 |
|------|------|------|
| 테스트 통과율 | 100% | 100% |
| 테스트 커버리지 | 60% | 80%+ |
| 빌드 성공 | ✅ | ✅ |

**핵심: 최대 5회 재시도 후에도 계속 진행하지만, 최소한 중요 기능은 검증되어야 함**

### Phase 6.5: 빌드 및 실행 검증 - **5회 재시도 정책 + 실제 빌드**

**실제 빌드 및 실행으로 동작 확인, 최대 5회 시도**:

```typescript
// 실제 빌드 및 실행
avengers_build_and_verify({
  taskId: "T001",
  projectPath: "./",
  projectType: "auto-detect",  // frontend | backend | desktop
  maxRetries: 5
})
```

**빌드 및 검증 절차:**

**프론트엔드 프로젝트:**
```bash
# Attempt 1-5:
1. npm/yarn install → 의존성 설치
2. npm run build → 실제 번들 생성
3. npm run lint → 코드 스타일 검증
4. npm test → 컴포넌트 테스트
5. npm run start:test → 로컬 서버 실행
6. Health Check: http://localhost:3000 → 응답 확인
7. Core Features: 로그인, 메뉴 클릭 등 기본 기능 동작 확인
```

**백엔드 프로젝트:**
```bash
# Attempt 1-5:
1. npm/pip/mvn install → 의존성 설치
2. npm run build → 컴파일/번들 생성
3. npm run lint → 코드 스타일 검증
4. npm run test → 단위/통합 테스트
5. npm run dev/start → 로컬 서버 실행
6. Health Check: curl http://localhost:3001/health → 200 OK
7. Core APIs: GET /api/status, POST /api/auth → 동작 확인
```

**데스크톱 프로젝트 (Qt/QML 등):**
```bash
# Attempt 1-5:
1. cmake .. -DCMAKE_BUILD_TYPE=Release → 빌드 설정
2. cmake --build . → 실제 컴파일
3. ctest → 단위 테스트 실행
4. ./tossplace-desktop (또는 .exe) → 바이너리 실행
5. Functional Test: 메인 윈도우 표시, 버튼 클릭, 데이터 조회 확인
6. Crash Test: 5초 이상 안정적 실행 확인
```

**결과 분석:**

- ✅ **빌드 성공 + 실행 정상**:
  ```
  모든 기준 만족 → Phase 7로 진행
  확인 사항:
  - 빌드 성공 (컴파일 에러 없음)
  - 애플리케이션 실행 (런타임 에러 없음)
  - 기본 기능 동작 (핵심 피처 작동)
  ```

- ❌ **빌드 실패 또는 런타임 에러 (Attempt < 5)**:
  ```
  에러 분석 (Groot)
    → 빌드 에러 또는 런타임 에러 추출
    → IronMan/Natasha에게 수정 요청
    → Phase 5로 복귀하여 수정
    → Phase 5-Review 재검증
    → Phase 6 테스트 재실행
    → 다시 Phase 6.5 빌드 (재시도 +1)
  ```

- ⚠️ **5회 재시도 후에도 실패**:
  ```
  치명적 에러 vs 복구 가능 에러 판단:

  치명적 (Phase 6.5 계속 시도):
  - 런타임 크래시
  - 핵심 기능 불가능

  복구 가능 (Phase 7로 진행):
  - 마이너 컴파일 경고
  - 선택적 기능 동작 안 함
  - 성능 최적화 미완료

  중요: 절대 포기하지 않음. 일부 기능이라도 동작하면 진행.
  ```

**성공 기준:**

| 기준 | 필수 | 확인 방법 |
|------|------|---------|
| 빌드 성공 | ✅ | 컴파일 완료, 바이너리 생성 |
| 애플리케이션 실행 | ✅ | 크래시 없이 실행, 5초 이상 안정성 |
| 기본 기능 동작 | ✅ | 메인 기능 1개 이상 작동 확인 |
| 헬스 체크 통과 | ✅ | Health endpoint 200 OK 또는 UI 표시 |

**핵심: 최대 5회 재시도. 빌드 성공 + 기본 기능 동작 확인 필수. 완벽함보다 동작함이 우선.**

### Phase 7: 문서화 (Vision)

완료 기준에 따라 자동 생성:

```
avengers_dispatch_agent({
  agent: "vision",
  task: "생성: README, API 문서, 아키텍처 다이어그램",
  mode: "foreground"
})
→ 문서 생성될 때까지 계속 시도
```

### Phase 8: CI/CD 파이프라인 (Hawkeye)

```
if (completionLevel === "full_cicd") {
  avengers_generate_cicd({
    platform: "github-actions",
    features: { lint: true, test: true, build: true, deploy: true }
  })
  → 파이프라인 설정 완료까지 계속 시도
}
```

## 완료 기준별 Phase 실행

| 완료 기준 | 실행 Phase | 사용 시나리오 |
|----------|-----------|--------------|
| `code_only` | 0-5 | 프로토타입, 빠른 실험 |
| `with_tests` | 0-6 | 일반 개발 (기본값) |
| `with_execution` | 0-6.5 | 중요 기능, 사용자 대면 |
| `with_docs` | 0-7 | API 공개, 팀 공유 |
| `full_cicd` | 0-8 | 프로덕션 배포 |

## 사용법

```
/assemble {상세한_요청_설명}
```

### 사용 예시

```
✅ /assemble Toss Place 클론 데스크톱 앱 만들어줘
   → 즉시 Phase 0-8 시작 (분석 → 설계 → 개발 → 테스트 → 완료)

✅ /assemble 사용자 인증 시스템 구현
   → 즉시 풀 개발 사이클 시작

✅ /assemble REST API 설계해줘
   → 즉시 계획 수립 (Jarvis → Dr.Strange → 설계 완료)

✅ /assemble 로그인 버그 고쳐줘
   → 즉시 버그 분석 → 수정 → 테스트 (반복!)
```

## 핵심 특징: Infinity War 원칙 - 실제 구현

| 특징 | 설명 | 구현 |
|------|------|------|
| **즉시 실행** | 분석 후 바로 에이전트 디스패치 | Phase 0 완료 → Phase 1 즉시 시작 |
| **자동 추론** | Reasonable defaults로 정보 자동 보충 | 사용자 질문 0개 |
| **코드 리뷰 게이트** | 모든 코드는 리뷰 통과 후 진행 | Phase 5-Review: 최대 3회 피드백 |
| **5회 재시도 (Phase 6)** | 테스트 실패 → 분석 → 수정 → 재시도 | 최대 5회 시도, 50% 커버리지 이상 |
| **5회 재시도 (Phase 6.5)** | 빌드 실패 → 분석 → 수정 → 재시도 | 최대 5회 시도, 일부 기능이라도 동작 |
| **병렬 작업** | Phase 5에서 모든 에이전트 동시 진행 | IronMan + Natasha + Groot 병렬 |
| **절대 포기 안 함** | 5회 재시도 후에도 가능한 진행 | 완벽함보다 동작함이 우선 |

### Infinity War 정책의 핵심: "끝날 때까지 끝나지 않음"

```
성공 ← Phase 완료 조건 충족까지
  ↑
  ├─ Phase 2-3: 최대 3회 재평가 (기획 품질)
  ├─ Phase 5-Review: 최대 3회 리뷰 (코드 품질)
  ├─ Phase 6: 최대 5회 재시도 (테스트)
  ├─ Phase 6.5: 최대 5회 재시도 (빌드 & 실행)
  └─ 실패 → 분석 → 수정 → 재시도 ─┘
```

**절대 포기하지 않는 원칙:**
- ✅ **Phase 2-3**: 계획이 70점 미만이면 3회까지 검증 과제 수행 후 재평가
- ✅ **Phase 5-Review**: 코드 리뷰 불통 시 최대 3회 피드백 및 재리뷰
- ✅ **Phase 6**: 테스트 실패 시 최대 5회 재시도 (실패 후에도 진행 가능)
- ✅ **Phase 6.5**: 빌드/실행 실패 시 최대 5회 재시도 (실패 후에도 진행 가능)
- ✅ **5회 재시도 후**: 부분적 성공이라도 계속 진행 (완벽함 > 포기하지 않음)

## 주의사항

⚠️ **사용자 질문은 최소화됩니다**
- 불가능한 경우 (보안, 법적 요구사항)에만 질문
- 대부분의 정보는 자동 추론으로 진행
- 필요시 설정 변경 후 재실행 가능

🎯 **품질 보장**
- TDD 기반 개발 (테스트 먼저)
- 모든 단계에서 검증 (테스트 통과까지 반복)
- 최종 E2E 테스트로 동작 확인

## 파라미터

$ARGUMENTS - 요청할 작업의 상세 설명 (더 구체할수록 좋음)

**Captain이 즉시 분석을 시작하고 에이전트 팀을 소집합니다. 끝날 때까지 계속 진행합니다.**
