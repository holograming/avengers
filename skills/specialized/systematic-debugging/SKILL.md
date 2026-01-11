# Systematic Debugging Skill

체계적인 디버깅 방법론을 통해 버그를 효율적으로 찾고 수정합니다.

## Quick Start

```typescript
// 디버깅 세션 시작
const debugSession = {
  bug: "authentication-failure",
  symptom: "로그인 시 500 에러 발생",
  environment: "production",
  reproduced: false
}
```

---

## 개요 및 목적 (Overview & Purpose)

**체계적 디버깅(Systematic Debugging)**은 과학적 방법론을 적용하여 버그를 분석하고 해결하는 프로세스입니다. 직관이나 추측이 아닌 가설-검증 사이클을 통해 근본 원인을 찾습니다.

### 왜 체계적 디버깅이 필요한가?

1. **시간 절약**: 무작위 시도 대신 체계적 접근으로 디버깅 시간 단축
2. **근본 원인 발견**: 증상 해결이 아닌 실제 원인 파악
3. **재발 방지**: 동일 버그의 재발을 막는 구조적 해결
4. **지식 축적**: 디버깅 과정 문서화로 팀 학습

### 핵심 용어

| 용어 | 설명 |
|------|------|
| **Symptom** | 관찰 가능한 문제 현상 (에러 메시지, 비정상 동작) |
| **Root Cause** | 문제를 일으키는 근본적인 원인 |
| **Hypothesis** | 원인에 대한 검증 가능한 가설 |
| **Reproduction** | 동일 조건에서 버그를 재현하는 것 |
| **Bisect** | 이진 탐색으로 문제 지점을 찾는 기법 |
| **Stack Trace** | 에러 발생 시점의 호출 스택 |

---

## 과학적 디버깅 방법론 (Scientific Debugging)

### The Debugging Cycle

```
OBSERVE → HYPOTHESIZE → PREDICT → TEST → ANALYZE → (repeat or fix)
```

1. **OBSERVE**: 증상을 정확히 관찰하고 기록
2. **HYPOTHESIZE**: 가능한 원인에 대한 가설 수립
3. **PREDICT**: 가설이 맞다면 어떤 결과가 나올지 예측
4. **TEST**: 예측을 검증하는 실험 수행
5. **ANALYZE**: 결과 분석 후 가설 수정 또는 해결

### 디버깅 프로세스 단계

```typescript
const debuggingProcess = {
  phases: [
    { name: "reproduce", desc: "버그를 일관되게 재현" },
    { name: "isolate", desc: "문제 범위를 좁혀 격리" },
    { name: "identify", desc: "근본 원인 파악" },
    { name: "fix", desc: "수정 및 검증" },
    { name: "prevent", desc: "재발 방지 조치" }
  ]
}
```

### 가설 기반 디버깅 템플릿

```yaml
bug_report:
  id: "BUG-001"
  symptom: "사용자 로그인 시 간헐적 500 에러"

  observation:
    when: "2024-01-15 14:30 UTC"
    frequency: "전체 로그인의 약 5%"
    affected_users: "랜덤"
    error_message: "Connection timeout to auth service"

  hypotheses:
    - id: H1
      statement: "Auth 서비스 메모리 누수로 인한 응답 지연"
      evidence_for: ["메모리 사용량 점진적 증가 로그"]
      evidence_against: []
      test: "메모리 모니터링 + 서비스 재시작 후 관찰"

    - id: H2
      statement: "데이터베이스 커넥션 풀 고갈"
      evidence_for: ["동시 접속 피크 시간대에 집중"]
      evidence_against: ["DB 커넥션 메트릭 정상"]
      test: "커넥션 풀 사이즈 로그 확인"

  current_hypothesis: H1
  status: "testing"
```

---

## 버그 재현 전략 (Bug Reproduction Strategy)

### 재현의 중요성

**"재현할 수 없으면 수정할 수 없다"**

버그 재현은 디버깅의 첫 번째이자 가장 중요한 단계입니다.

### 재현 체크리스트

```yaml
reproduction_checklist:
  environment:
    - [ ] 동일한 OS 버전
    - [ ] 동일한 런타임 버전 (Node, Python, JVM 등)
    - [ ] 동일한 의존성 버전
    - [ ] 동일한 환경 변수
    - [ ] 동일한 네트워크 조건

  data:
    - [ ] 동일한 입력 데이터
    - [ ] 동일한 데이터베이스 상태
    - [ ] 동일한 캐시 상태
    - [ ] 동일한 세션 상태

  timing:
    - [ ] 동일한 시간대 (타임존, 서머타임)
    - [ ] 동일한 시스템 부하
    - [ ] 동일한 동시성 조건
```

### 재현 환경 구축

```bash
# 1. Docker로 격리된 환경 생성
docker run -it --name debug-env \
  -e NODE_ENV=production \
  -e DEBUG=* \
  -v $(pwd):/app \
  node:18 bash

# 2. 정확한 의존성 버전 설치
npm ci  # package-lock.json 기반 설치

# 3. 프로덕션 데이터 스냅샷 복원 (익명화 필요)
pg_restore --dbname=debug_db production_snapshot.dump
```

### 간헐적 버그 재현 기법

```typescript
// 반복 실행으로 간헐적 버그 포착
async function reproduceFlaky(testFn: () => Promise<void>, attempts = 100) {
  const failures: Error[] = [];

  for (let i = 0; i < attempts; i++) {
    try {
      await testFn();
    } catch (e) {
      failures.push(e as Error);
      console.log(`Failure ${failures.length} at attempt ${i + 1}`);
    }
  }

  console.log(`Failure rate: ${failures.length}/${attempts} (${(failures.length/attempts*100).toFixed(1)}%)`);
  return failures;
}

// 스트레스 조건에서 재현
async function reproduceUnderStress(testFn: () => Promise<void>) {
  // 메모리 압박
  const memoryPressure = Array(1000000).fill('x'.repeat(1000));

  // CPU 부하
  const cpuLoad = setInterval(() => {
    for (let i = 0; i < 1000000; i++) Math.random();
  }, 10);

  try {
    await testFn();
  } finally {
    clearInterval(cpuLoad);
    memoryPressure.length = 0;
  }
}
```

---

## 이진 탐색 디버깅 (Binary Search Debugging)

### Git Bisect

문제가 발생한 커밋을 O(log n) 복잡도로 찾습니다.

```bash
# 1. Bisect 시작
git bisect start

# 2. 현재 (문제 있는) 커밋을 bad로 표시
git bisect bad

# 3. 문제 없던 마지막 알려진 커밋을 good으로 표시
git bisect good v1.2.0

# 4. Git이 중간 커밋으로 체크아웃, 테스트 후 결과 입력
# ... 테스트 실행 ...
git bisect good  # 또는 git bisect bad

# 5. 문제 커밋 발견될 때까지 반복
# Git: "abc1234 is the first bad commit"

# 6. Bisect 종료
git bisect reset
```

### 자동화된 Git Bisect

```bash
# 테스트 스크립트로 자동 bisect
git bisect start HEAD v1.2.0
git bisect run npm test

# 또는 커스텀 스크립트
git bisect run ./scripts/test-bug.sh
```

```bash
#!/bin/bash
# scripts/test-bug.sh

# 빌드
npm run build || exit 125  # 125 = skip this commit

# 특정 테스트 실행
npm run test -- --grep "login should work"
exit $?  # 0 = good, 1+ = bad
```

### 코드 내 이진 탐색

```typescript
// 큰 함수에서 문제 지점 찾기
async function complexProcess(data: Data) {
  console.log("Checkpoint 1: Start");
  const step1 = await processStep1(data);

  console.log("Checkpoint 2: After step1", { step1 });
  const step2 = await processStep2(step1);

  console.log("Checkpoint 3: After step2", { step2 });
  const step3 = await processStep3(step2);

  // 이진 탐색: 중간 지점에 체크포인트 추가
  // 문제가 체크포인트 3 이후라면, step3와 결과 사이에 추가 체크포인트

  console.log("Checkpoint 4: After step3", { step3 });
  const result = await finalProcess(step3);

  console.log("Checkpoint 5: Final", { result });
  return result;
}
```

### Delta Debugging

최소 실패 케이스를 찾는 기법:

```typescript
// 입력을 줄여가며 최소 실패 케이스 찾기
async function deltaDebug<T>(
  input: T[],
  test: (subset: T[]) => Promise<boolean>
): Promise<T[]> {
  let failingInput = [...input];

  // 점점 작은 단위로 테스트
  let granularity = 2;
  while (failingInput.length > 1) {
    const chunkSize = Math.ceil(failingInput.length / granularity);
    const chunks: T[][] = [];

    for (let i = 0; i < failingInput.length; i += chunkSize) {
      chunks.push(failingInput.slice(i, i + chunkSize));
    }

    let reduced = false;
    for (const chunk of chunks) {
      const complement = failingInput.filter(x => !chunk.includes(x));
      if (await test(complement)) {
        // complement만으로도 실패 - chunk 불필요
        failingInput = complement;
        reduced = true;
        break;
      }
    }

    if (!reduced) {
      granularity *= 2;
      if (granularity > failingInput.length) break;
    } else {
      granularity = 2;
    }
  }

  return failingInput;
}
```

---

## 로그 분석 기법 (Log Analysis)

### 효과적인 로깅 전략

```typescript
// 구조화된 로깅
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// 컨텍스트 포함 로깅
function processRequest(req: Request) {
  const requestLogger = logger.child({
    requestId: req.id,
    userId: req.user?.id,
    path: req.path,
    method: req.method,
  });

  requestLogger.info('Request started');

  try {
    const result = handleRequest(req);
    requestLogger.info({ result }, 'Request completed');
    return result;
  } catch (error) {
    requestLogger.error({
      error: error.message,
      stack: error.stack,
      code: error.code,
    }, 'Request failed');
    throw error;
  }
}
```

### 로그 레벨 가이드

| 레벨 | 용도 | 예시 |
|------|------|------|
| **ERROR** | 즉시 조치 필요 | DB 연결 실패, 인증 서비스 다운 |
| **WARN** | 잠재적 문제 | 재시도 발생, 성능 저하 |
| **INFO** | 주요 이벤트 | 요청 시작/종료, 상태 변경 |
| **DEBUG** | 상세 정보 | 변수 값, 분기 결정 |
| **TRACE** | 매우 상세 | 모든 함수 호출, 루프 반복 |

### 로그 검색 및 분석

```bash
# 특정 에러 패턴 찾기
grep -E "ERROR|FATAL" app.log | tail -100

# 특정 요청 ID 추적
grep "requestId.*abc123" app.log

# 시간대별 에러 빈도
grep "ERROR" app.log | cut -d' ' -f1,2 | uniq -c | sort -rn

# JSON 로그 분석 (jq 사용)
cat app.log | jq 'select(.level == "error") | {time, message, error}'

# 에러 유형별 집계
cat app.log | jq 'select(.level == "error") | .error.code' | sort | uniq -c
```

### 분산 시스템 로그 추적

```typescript
// 분산 추적을 위한 상관 ID
import { v4 as uuidv4 } from 'uuid';

function createTraceContext() {
  return {
    traceId: uuidv4(),
    spanId: uuidv4(),
    parentSpanId: null as string | null,
  };
}

// 서비스 간 호출 시 컨텍스트 전파
async function callService(url: string, trace: TraceContext) {
  const childSpan = {
    ...trace,
    spanId: uuidv4(),
    parentSpanId: trace.spanId,
  };

  return fetch(url, {
    headers: {
      'X-Trace-Id': trace.traceId,
      'X-Span-Id': childSpan.spanId,
      'X-Parent-Span-Id': childSpan.parentSpanId,
    },
  });
}
```

---

## 프로파일링 도구 활용 (Profiling Tools)

### CPU 프로파일링

```javascript
// Node.js CPU 프로파일링
const inspector = require('inspector');
const fs = require('fs');
const session = new inspector.Session();
session.connect();

// 프로파일링 시작
session.post('Profiler.enable');
session.post('Profiler.start');

// ... 분석할 코드 실행 ...

// 프로파일링 종료 및 저장
session.post('Profiler.stop', (err, { profile }) => {
  fs.writeFileSync('profile.cpuprofile', JSON.stringify(profile));
  // Chrome DevTools에서 열어서 분석
});
```

```bash
# Node.js 내장 프로파일러
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# Python 프로파일링
python -m cProfile -o profile.pstats app.py
python -m pstats profile.pstats
```

### 메모리 프로파일링

```javascript
// Node.js 힙 스냅샷
const v8 = require('v8');
const fs = require('fs');

function takeHeapSnapshot() {
  const snapshotPath = `heap-${Date.now()}.heapsnapshot`;
  const writeStream = fs.createWriteStream(snapshotPath);
  v8.writeHeapSnapshot(snapshotPath);
  console.log(`Heap snapshot written to ${snapshotPath}`);
}

// 주기적 스냅샷으로 메모리 증가 추적
setInterval(takeHeapSnapshot, 60000);
```

```bash
# Chrome DevTools 연결
node --inspect app.js
# chrome://inspect 에서 연결 후 Memory 탭에서 분석
```

### 프로파일링 결과 해석

```yaml
profiling_analysis:
  cpu:
    hot_spots:
      - function: "parseJSON"
        self_time: "45%"
        action: "캐싱 또는 스트리밍 파서 적용"
      - function: "cryptoHash"
        self_time: "30%"
        action: "해시 알고리즘 최적화 검토"

  memory:
    top_allocations:
      - type: "String"
        count: 1500000
        size: "200MB"
        action: "문자열 인터닝 또는 Buffer 사용"
      - type: "Object"
        count: 500000
        size: "150MB"
        action: "객체 풀링 검토"
```

---

## 메모리 누수 탐지 (Memory Leak Detection)

### 메모리 누수 패턴

| 패턴 | 원인 | 해결 |
|------|------|------|
| **이벤트 리스너 누적** | removeListener 미호출 | 정리 로직 추가 |
| **클로저 캡처** | 불필요한 참조 유지 | 약한 참조 또는 명시적 해제 |
| **전역 캐시 무한 성장** | 만료 정책 없음 | LRU 캐시 적용 |
| **순환 참조** | 객체 간 상호 참조 | WeakRef 또는 구조 변경 |
| **타이머 정리 누락** | clearInterval 미호출 | 정리 로직 필수 |

### 메모리 누수 탐지 코드

```typescript
// 메모리 사용량 모니터링
function monitorMemory(intervalMs = 5000) {
  const readings: { time: Date; heapUsed: number }[] = [];

  setInterval(() => {
    const usage = process.memoryUsage();
    readings.push({
      time: new Date(),
      heapUsed: usage.heapUsed,
    });

    // 최근 10개 측정값으로 추세 분석
    if (readings.length >= 10) {
      const recent = readings.slice(-10);
      const trend = recent[9].heapUsed - recent[0].heapUsed;
      const avgGrowth = trend / 10;

      if (avgGrowth > 1024 * 1024) { // 1MB/interval 이상 증가
        console.warn('Potential memory leak detected', {
          growth: `${(avgGrowth / 1024 / 1024).toFixed(2)}MB per interval`,
          currentHeap: `${(recent[9].heapUsed / 1024 / 1024).toFixed(2)}MB`,
        });
      }
    }
  }, intervalMs);
}
```

### 일반적인 메모리 누수 수정

```typescript
// BAD: 이벤트 리스너 누수
class LeakyComponent {
  constructor(emitter: EventEmitter) {
    emitter.on('data', this.handleData); // 절대 제거 안됨
  }
  handleData = (data: any) => { /* ... */ };
}

// GOOD: 정리 로직 포함
class SafeComponent {
  private emitter: EventEmitter;

  constructor(emitter: EventEmitter) {
    this.emitter = emitter;
    this.emitter.on('data', this.handleData);
  }

  handleData = (data: any) => { /* ... */ };

  destroy() {
    this.emitter.off('data', this.handleData);
  }
}

// BAD: 무한 성장 캐시
const cache = new Map();
function getValue(key: string) {
  if (!cache.has(key)) {
    cache.set(key, computeExpensiveValue(key));
  }
  return cache.get(key);
}

// GOOD: LRU 캐시
import LRU from 'lru-cache';
const cache = new LRU<string, any>({ max: 1000 });
function getValue(key: string) {
  if (!cache.has(key)) {
    cache.set(key, computeExpensiveValue(key));
  }
  return cache.get(key);
}
```

---

## Race Condition 디버깅 (Race Condition Debugging)

### Race Condition 유형

| 유형 | 설명 | 증상 |
|------|------|------|
| **Data Race** | 동시 쓰기/읽기 충돌 | 데이터 손상, 일관성 없음 |
| **Race Condition** | 타이밍 의존적 동작 | 간헐적 버그, 환경 따라 다름 |
| **Deadlock** | 상호 대기 | 무한 대기, 응답 없음 |
| **Livelock** | 진행 없는 반복 | CPU 100%, 진행 안됨 |

### Race Condition 탐지 기법

```typescript
// 의심되는 경쟁 조건에 지연 삽입
async function debugRaceCondition() {
  const originalFn = database.update;

  database.update = async function(...args) {
    // 인위적 지연으로 경쟁 조건 유발
    await new Promise(resolve =>
      setTimeout(resolve, Math.random() * 100)
    );
    return originalFn.apply(this, args);
  };

  // 테스트 실행 - 더 자주 실패해야 함
  await runConcurrentTests();
}
```

```typescript
// 동시성 테스트
async function testConcurrency() {
  const results: number[] = [];
  let counter = 0;

  // 동시에 1000개의 증가 요청
  const promises = Array(1000).fill(null).map(async () => {
    const current = counter;
    await delay(Math.random() * 10); // 비동기 작업 시뮬레이션
    counter = current + 1;
    results.push(counter);
  });

  await Promise.all(promises);

  console.log('Expected:', 1000);
  console.log('Actual:', counter);
  // Race condition이 있으면 counter < 1000
}
```

### Race Condition 해결 패턴

```typescript
// 1. Mutex/Lock 사용
import { Mutex } from 'async-mutex';

class SafeCounter {
  private mutex = new Mutex();
  private count = 0;

  async increment() {
    const release = await this.mutex.acquire();
    try {
      this.count++;
      return this.count;
    } finally {
      release();
    }
  }
}

// 2. Atomic 연산 사용
import { AtomicInteger } from './atomic';

const counter = new AtomicInteger(0);
await Promise.all(
  Array(1000).fill(null).map(() => counter.incrementAndGet())
);

// 3. 직렬화 큐
class SerialQueue {
  private queue: (() => Promise<void>)[] = [];
  private processing = false;

  async enqueue(task: () => Promise<void>) {
    return new Promise<void>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await task();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task();
    }

    this.processing = false;
  }
}
```

### 데드락 탐지

```typescript
// 타임아웃으로 데드락 탐지
async function withDeadlockDetection<T>(
  operation: () => Promise<T>,
  timeoutMs = 5000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Potential deadlock: operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([operation(), timeoutPromise]);
}

// 락 획득 순서 검증
class LockOrderValidator {
  private static lockOrder = new Map<string, number>();
  private static threadLocks = new Map<string, string[]>();

  static acquireLock(lockName: string, threadId: string) {
    const order = this.lockOrder.get(lockName) ?? this.lockOrder.size;
    this.lockOrder.set(lockName, order);

    const heldLocks = this.threadLocks.get(threadId) ?? [];

    for (const held of heldLocks) {
      const heldOrder = this.lockOrder.get(held)!;
      if (heldOrder > order) {
        console.error(`Lock order violation: ${lockName} acquired after ${held}`);
      }
    }

    heldLocks.push(lockName);
    this.threadLocks.set(threadId, heldLocks);
  }
}
```

---

## 원격 디버깅 기법 (Remote Debugging)

### Node.js 원격 디버깅

```bash
# 원격 서버에서 디버그 모드로 실행
node --inspect=0.0.0.0:9229 app.js

# SSH 터널링으로 안전하게 연결
ssh -L 9229:localhost:9229 user@remote-server

# 로컬에서 chrome://inspect 접속
```

### 프로덕션 환경 디버깅

```typescript
// 조건부 디버그 엔드포인트
import express from 'express';

const debugRouter = express.Router();

// 인증 필수
debugRouter.use(requireAdminAuth);

// 런타임 상태 조회
debugRouter.get('/state', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: connectionPool.getStats(),
    cache: cache.getStats(),
  });
});

// 동적 로그 레벨 변경
debugRouter.post('/log-level', (req, res) => {
  const { level } = req.body;
  logger.level = level;
  res.json({ message: `Log level set to ${level}` });
});

// 힙 스냅샷 생성 (주의: 성능 영향)
debugRouter.post('/heap-snapshot', async (req, res) => {
  const filename = `heap-${Date.now()}.heapsnapshot`;
  v8.writeHeapSnapshot(filename);
  res.json({ filename });
});

// 프로덕션에서는 비활성화 또는 엄격한 인증
if (process.env.ENABLE_DEBUG_ENDPOINTS === 'true') {
  app.use('/debug', debugRouter);
}
```

### 원격 로그 스트리밍

```typescript
// 실시간 로그 스트리밍
import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8080 });

// 로그 스트림에 연결
wss.on('connection', (ws, req) => {
  // 인증 검증
  if (!validateDebugToken(req.url)) {
    ws.close();
    return;
  }

  const logHandler = (log: LogEntry) => {
    ws.send(JSON.stringify(log));
  };

  logEmitter.on('log', logHandler);

  ws.on('close', () => {
    logEmitter.off('log', logHandler);
  });
});
```

### 컨테이너 환경 디버깅

```bash
# 실행 중인 컨테이너에 접속
docker exec -it container_name sh

# 컨테이너 로그 확인
docker logs -f --tail 100 container_name

# 임시 디버그 컨테이너 실행 (네트워크 공유)
docker run -it --rm \
  --network container:target_container \
  nicolaka/netshoot

# Kubernetes Pod 디버깅
kubectl exec -it pod-name -- sh
kubectl logs -f pod-name
kubectl debug pod-name --image=busybox --target=container-name
```

---

## 디버깅 체크리스트 템플릿 (Debugging Checklists)

### 초기 분석 체크리스트

```yaml
initial_analysis:
  symptom_collection:
    - [ ] 에러 메시지 전체 기록
    - [ ] 스택 트레이스 수집
    - [ ] 발생 시간 및 빈도 확인
    - [ ] 영향받는 사용자/기능 범위 파악

  environment_check:
    - [ ] 어떤 환경에서 발생? (dev/staging/prod)
    - [ ] 최근 배포 여부
    - [ ] 인프라 변경 여부
    - [ ] 의존 서비스 상태

  reproduction_attempt:
    - [ ] 재현 가능한가?
    - [ ] 재현 조건 문서화
    - [ ] 최소 재현 케이스 작성
```

### 가설 검증 체크리스트

```yaml
hypothesis_testing:
  before_test:
    - [ ] 가설을 명확히 기술했는가?
    - [ ] 예측되는 결과를 정의했는가?
    - [ ] 테스트 방법이 가설을 검증하는가?

  during_test:
    - [ ] 한 번에 하나의 변수만 변경하는가?
    - [ ] 결과를 기록하고 있는가?
    - [ ] 예상치 못한 관찰을 기록하는가?

  after_test:
    - [ ] 예측과 결과가 일치하는가?
    - [ ] 가설이 확인/반증되었는가?
    - [ ] 다음 단계가 결정되었는가?
```

### 수정 적용 체크리스트

```yaml
fix_application:
  before_fix:
    - [ ] 근본 원인이 확실히 파악되었는가?
    - [ ] 수정이 부작용을 일으키지 않는가?
    - [ ] 회귀 테스트가 준비되었는가?

  fix_implementation:
    - [ ] 최소한의 변경으로 해결하는가?
    - [ ] 코드 리뷰를 받았는가?
    - [ ] 문서화/주석 추가했는가?

  after_fix:
    - [ ] 원래 버그가 수정되었는가?
    - [ ] 회귀 테스트 통과했는가?
    - [ ] 모니터링/알림 추가했는가?
```

### 디버깅 사후 분석 템플릿

```yaml
postmortem:
  summary:
    bug_id: "BUG-XXX"
    title: "간단한 버그 설명"
    severity: critical/high/medium/low
    time_to_resolve: "X시간"

  timeline:
    - "2024-01-15 14:00 - 버그 보고됨"
    - "2024-01-15 14:30 - 재현 성공"
    - "2024-01-15 15:00 - 근본 원인 파악"
    - "2024-01-15 16:00 - 수정 배포"

  root_cause:
    description: "상세한 근본 원인 설명"
    code_location: "파일 경로 및 라인"
    introduced_by: "커밋 해시 또는 변경 내용"

  fix:
    description: "수정 내용 설명"
    pr_link: "PR 링크"

  prevention:
    short_term:
      - "즉시 취한 조치"
    long_term:
      - "재발 방지를 위한 구조적 개선"
    monitoring:
      - "추가한 모니터링/알림"

  lessons_learned:
    what_went_well:
      - "잘 된 점"
    what_went_wrong:
      - "개선할 점"
```

---

## 도구별 디버깅 명령어 참조

### 공통 디버깅 도구

```bash
# 프로세스 정보
ps aux | grep node
top -p PID

# 네트워크 상태
netstat -an | grep LISTEN
ss -tulpn
lsof -i :3000

# 파일 디스크립터
ls -la /proc/PID/fd
lsof -p PID

# 시스템 호출 추적
strace -p PID
dtrace -p PID  # macOS
```

### Node.js 디버깅

```bash
# 메모리 사용량
node --expose-gc script.js
node -e "global.gc(); console.log(process.memoryUsage())"

# 프로파일링
node --prof app.js
node --prof-process isolate-*.log

# 힙 스냅샷
node --inspect app.js
# Chrome DevTools Memory 탭 사용
```

### Python 디버깅

```bash
# 인터랙티브 디버거
python -m pdb script.py

# 메모리 프로파일링
python -m memory_profiler script.py

# 라인별 프로파일링
kernprof -l -v script.py
```

### Go 디버깅

```bash
# Delve 디버거
dlv debug ./main.go
dlv attach PID

# Race detector
go run -race main.go
go test -race ./...

# pprof 프로파일링
go tool pprof http://localhost:6060/debug/pprof/heap
```

---

## Best Practices

### 디버깅 접근법

1. **증상이 아닌 원인을 찾아라**: 증상만 수정하면 버그가 재발한다
2. **한 번에 하나만 변경하라**: 여러 변경 동시 적용 시 원인 특정 불가
3. **모든 것을 기록하라**: 시도, 결과, 관찰을 문서화
4. **가정을 검증하라**: "당연히 맞을 것"이라는 가정이 종종 원인
5. **휴식을 취하라**: 막히면 잠시 떠나서 fresh한 시각으로 돌아오기

### 팀 디버깅

1. **러버덕 디버깅**: 문제를 다른 사람(또는 인형)에게 설명
2. **페어 디버깅**: 두 명이 함께 디버깅하면 놓치는 것 감소
3. **디버깅 세션 시간 제한**: 2시간 이상 혼자 막혀있지 말 것
4. **경험 공유**: 해결한 버그를 팀에 공유하여 학습

### 예방적 디버깅

1. **에러 핸들링 강화**: 모든 예외 상황 처리
2. **로깅 표준화**: 일관된 로그 포맷과 레벨
3. **모니터링 설정**: 이상 징후 조기 감지
4. **테스트 커버리지**: 버그 수정 시 회귀 테스트 추가

---

## Rules

1. **재현 우선**: 버그를 재현할 수 있어야 수정할 수 있다
2. **과학적 접근**: 추측이 아닌 가설-검증 사이클 사용
3. **문서화**: 디버깅 과정과 결과를 기록
4. **최소 변경**: 가장 작은 수정으로 문제 해결
5. **테스트 추가**: 수정 후 반드시 회귀 테스트 작성
6. **원인 분석**: 근본 원인을 파악하고 재발 방지 조치
7. **팀 학습**: 해결한 버그를 팀과 공유하여 지식 축적
