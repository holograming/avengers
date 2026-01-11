# Backend Development Skill

백엔드 개발을 위한 포괄적인 가이드입니다.

## Quick Start

```typescript
// Express 서버 설정
import express from 'express';
const app = express();
app.use(express.json());
app.listen(3000);
```

---

## API 설계 (API Design)

### RESTful 원칙

```
GET    /api/users      → 목록 조회
GET    /api/users/:id  → 단일 조회
POST   /api/users      → 생성
PUT    /api/users/:id  → 전체 수정
PATCH  /api/users/:id  → 부분 수정
DELETE /api/users/:id  → 삭제
```

### HTTP 상태 코드

| 코드 | 의미 | 사용 시점 |
|------|------|----------|
| 200 | OK | 성공적인 GET/PUT/PATCH |
| 201 | Created | 성공적인 POST |
| 204 | No Content | 성공적인 DELETE |
| 400 | Bad Request | 잘못된 요청 데이터 |
| 401 | Unauthorized | 인증 필요 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 충돌 (중복 등) |
| 500 | Internal Error | 서버 오류 |

### 요청/응답 패턴

```typescript
// 성공 응답
{
  "data": { ... },
  "meta": {
    "page": 1,
    "total": 100
  }
}

// 에러 응답
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [...]
  }
}
```

---

## 데이터베이스 (Database)

### SQL 기본

```sql
-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);

-- 조인 쿼리
SELECT u.*, p.title
FROM users u
JOIN posts p ON u.id = p.user_id
WHERE u.status = 'active';

-- 트랜잭션
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

### ORM 패턴 (TypeORM)

```typescript
// Entity 정의
@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];
}

// Repository 사용
const users = await userRepository.find({
  where: { status: 'active' },
  relations: ['posts'],
  take: 10,
  skip: 0
});
```

### 마이그레이션

```typescript
// 마이그레이션 생성
export class AddUserStatus1234567890 implements MigrationInterface {
  async up(queryRunner: QueryRunner) {
    await queryRunner.addColumn('users',
      new TableColumn({ name: 'status', type: 'varchar', default: "'active'" })
    );
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.dropColumn('users', 'status');
  }
}
```

---

## 인증/인가 (Auth)

### JWT 인증

```typescript
// 토큰 생성
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

// 미들웨어
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### OAuth 2.0 플로우

```
1. 클라이언트 → Authorization Server: 인가 요청
2. 사용자 로그인 및 동의
3. Authorization Server → 클라이언트: Authorization Code
4. 클라이언트 → Authorization Server: Code + Secret
5. Authorization Server → 클라이언트: Access Token
```

### 권한 관리 (RBAC)

```typescript
// 권한 체크 미들웨어
const requireRole = (...roles: string[]) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// 사용
app.delete('/api/users/:id', authMiddleware, requireRole('admin'), deleteUser);
```

---

## 캐싱 (Caching)

### Redis 패턴

```typescript
// 캐시 조회/저장
const getCachedUser = async (id: string) => {
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  const user = await db.users.findOne(id);
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  return user;
};

// 캐시 무효화
const updateUser = async (id: string, data: any) => {
  await db.users.update(id, data);
  await redis.del(`user:${id}`);
};
```

### 캐시 전략

| 전략 | 설명 | 사용 시점 |
|------|------|----------|
| Cache-Aside | 앱이 캐시 관리 | 범용 |
| Write-Through | 쓰기 시 캐시도 갱신 | 일관성 중요 |
| Write-Behind | 비동기 캐시 쓰기 | 성능 중요 |
| TTL | 시간 기반 만료 | 빈번한 읽기 |

---

## 메시지 큐 (Message Queue)

### RabbitMQ 패턴

```typescript
// Producer
await channel.assertQueue('tasks');
channel.sendToQueue('tasks', Buffer.from(JSON.stringify(task)));

// Consumer
channel.consume('tasks', async (msg) => {
  const task = JSON.parse(msg.content.toString());
  await processTask(task);
  channel.ack(msg);
});
```

### 이벤트 기반 아키텍처

```typescript
// 이벤트 발행
eventBus.publish('user.created', { userId: user.id, email: user.email });

// 이벤트 구독
eventBus.subscribe('user.created', async (event) => {
  await sendWelcomeEmail(event.email);
  await createUserAnalytics(event.userId);
});
```

---

## 보안 (Security)

### 입력 검증

```typescript
// Zod 스키마 검증
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  age: z.number().int().positive().optional()
});

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  req.body = result.data;
  next();
};
```

### SQL Injection 방지

```typescript
// 나쁜 예 (취약)
const query = `SELECT * FROM users WHERE id = ${userId}`;

// 좋은 예 (파라미터화)
const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 요청 수
  message: { error: 'Too many requests' }
});

app.use('/api/', limiter);
```

---

## 에러 처리 (Error Handling)

### 전역 에러 핸들러

```typescript
// 커스텀 에러 클래스
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

// 전역 핸들러
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message }
    });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
});
```

### 비동기 에러 래퍼

```typescript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  res.json({ data: user });
}));
```

---

## 로깅 & 모니터링 (Logging & Monitoring)

### 구조화된 로깅

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  }
});

// 요청 로깅
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    requestId: req.headers['x-request-id']
  }, 'incoming request');
  next();
});
```

### 메트릭 수집

```typescript
// Prometheus 메트릭
import { Counter, Histogram } from 'prom-client';

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path']
});
```

---

## 테스트 (Testing)

### 통합 테스트

```typescript
import request from 'supertest';

describe('POST /api/users', () => {
  it('creates a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201);

    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.email).toBe('test@example.com');
  });

  it('returns 400 for invalid email', async () => {
    await request(app)
      .post('/api/users')
      .send({ email: 'invalid', password: 'password123' })
      .expect(400);
  });
});
```

### 데이터베이스 테스트

```typescript
beforeEach(async () => {
  await db.query('TRUNCATE users CASCADE');
});

afterAll(async () => {
  await db.close();
});
```

---

## Best Practices

1. **12-Factor App 원칙 준수**
   - 환경변수로 설정 관리
   - 상태 없는 프로세스
   - 로그를 스트림으로 처리

2. **계층 분리**
   - Controller → Service → Repository
   - 비즈니스 로직은 Service에

3. **데이터베이스**
   - 인덱스 최적화
   - N+1 쿼리 방지
   - 커넥션 풀 사용

4. **보안**
   - 모든 입력 검증
   - Prepared Statement 사용
   - 민감 데이터 암호화

5. **성능**
   - 적절한 캐싱
   - 페이지네이션 적용
   - 비동기 처리 활용

---

## Rules

1. **API 버저닝**: `/api/v1/` 형식 사용
2. **일관된 응답 형식**: 모든 응답에 동일한 구조 사용
3. **유의미한 에러 메시지**: 클라이언트가 이해할 수 있는 메시지
4. **트랜잭션 관리**: 복합 작업은 트랜잭션으로 묶기
5. **헬스체크 엔드포인트**: `/health` 제공
