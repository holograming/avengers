# Backend Skill

Natasha 에이전트를 위한 백엔드 개발 가이드입니다.

## Quick Start

```typescript
// API 엔드포인트 구현
avengers_dispatch_agent({
  agent: "natasha",
  task: "사용자 인증 API 구현",
  worktree: true
})
```

---

## 목차

1. [API 설계 원칙](#api-설계-원칙)
2. [데이터베이스 패턴](#데이터베이스-패턴)
3. [인증/인가](#인증인가)
4. [마이크로서비스 아키텍처](#마이크로서비스-아키텍처)
5. [메시지 큐](#메시지-큐)
6. [캐싱 전략](#캐싱-전략)
7. [보안 베스트 프랙티스](#보안-베스트-프랙티스)
8. [로깅 및 모니터링](#로깅-및-모니터링)

---

## API 설계 원칙

### REST API 설계 (Richardson Maturity Model)

REST API의 성숙도를 4단계로 정의합니다.

| Level | 설명 | 특징 |
|-------|------|------|
| Level 0 | The Swamp of POX | 단일 URI, HTTP를 터널로만 사용 |
| Level 1 | Resources | 리소스 개념 도입, 개별 URI |
| Level 2 | HTTP Verbs | HTTP 메서드 활용 (GET, POST, PUT, DELETE) |
| Level 3 | HATEOAS | 하이퍼미디어 컨트롤 포함 |

#### Level 2 REST API 예시

```typescript
// Express.js REST API
import express from 'express';
import { Router } from 'express';

const router = Router();

// GET /users - 목록 조회
router.get('/users', async (req, res) => {
  const { page = 1, limit = 20, sort = 'createdAt' } = req.query;
  const users = await userService.findAll({ page, limit, sort });
  res.json({
    data: users,
    meta: { page, limit, total: users.total }
  });
});

// GET /users/:id - 단일 조회
router.get('/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ data: user });
});

// POST /users - 생성
router.post('/users', validateBody(createUserSchema), async (req, res) => {
  const user = await userService.create(req.body);
  res.status(201).json({ data: user });
});

// PUT /users/:id - 전체 수정
router.put('/users/:id', validateBody(updateUserSchema), async (req, res) => {
  const user = await userService.update(req.params.id, req.body);
  res.json({ data: user });
});

// PATCH /users/:id - 부분 수정
router.patch('/users/:id', validateBody(patchUserSchema), async (req, res) => {
  const user = await userService.patch(req.params.id, req.body);
  res.json({ data: user });
});

// DELETE /users/:id - 삭제
router.delete('/users/:id', async (req, res) => {
  await userService.delete(req.params.id);
  res.status(204).send();
});
```

#### Level 3 HATEOAS 예시

```typescript
// HATEOAS 응답 형식
const userResponse = {
  data: {
    id: "user-123",
    name: "John Doe",
    email: "john@example.com"
  },
  links: {
    self: { href: "/users/user-123", method: "GET" },
    update: { href: "/users/user-123", method: "PUT" },
    delete: { href: "/users/user-123", method: "DELETE" },
    orders: { href: "/users/user-123/orders", method: "GET" }
  }
};
```

#### HTTP 상태 코드 가이드

| 코드 | 의미 | 사용 상황 |
|------|------|----------|
| 200 | OK | 성공적인 GET, PUT, PATCH |
| 201 | Created | 성공적인 POST (리소스 생성) |
| 204 | No Content | 성공적인 DELETE |
| 400 | Bad Request | 잘못된 요청 형식 |
| 401 | Unauthorized | 인증 필요 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 리소스 충돌 |
| 422 | Unprocessable Entity | 유효성 검증 실패 |
| 429 | Too Many Requests | Rate limit 초과 |
| 500 | Internal Server Error | 서버 오류 |

### GraphQL 스키마 설계

```typescript
// schema.graphql
const typeDefs = `
  type User {
    id: ID!
    email: String!
    name: String!
    profile: Profile
    orders(first: Int, after: String): OrderConnection!
    createdAt: DateTime!
  }

  type OrderConnection {
    edges: [OrderEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    endCursor: String
  }

  input CreateUserInput {
    email: String!
    name: String!
    password: String!
  }

  type Query {
    user(id: ID!): User
    users(first: Int, after: String): UserConnection!
    me: User
  }

  type Mutation {
    createUser(input: CreateUserInput!): UserPayload!
    updateUser(id: ID!, input: UpdateUserInput!): UserPayload!
  }

  type Subscription {
    orderStatusChanged(userId: ID!): Order!
  }
`;

// resolvers.ts
const resolvers = {
  Query: {
    user: async (_, { id }, context) => {
      return context.dataSources.userAPI.getUser(id);
    },
    me: async (_, __, context) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      return context.dataSources.userAPI.getUser(context.user.id);
    }
  },
  User: {
    orders: async (parent, { first, after }, context) => {
      return context.dataSources.orderAPI.getOrdersByUser(parent.id, { first, after });
    }
  }
};
```

#### DataLoader를 사용한 N+1 문제 해결

```typescript
import DataLoader from 'dataloader';

const createLoaders = () => ({
  userLoader: new DataLoader(async (ids: string[]) => {
    const users = await User.find({ _id: { $in: ids } });
    const userMap = new Map(users.map(u => [u.id, u]));
    return ids.map(id => userMap.get(id) || null);
  })
});
```

### gRPC 및 Protocol Buffers

```protobuf
// user.proto
syntax = "proto3";
package user;

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc StreamUserUpdates(StreamRequest) returns (stream UserUpdate);
}

message User {
  string id = 1;
  string email = 2;
  string name = 3;
  UserStatus status = 4;
  google.protobuf.Timestamp created_at = 5;
}

enum UserStatus {
  USER_STATUS_UNSPECIFIED = 0;
  USER_STATUS_ACTIVE = 1;
  USER_STATUS_INACTIVE = 2;
}

message GetUserRequest {
  string id = 1;
}

message ListUsersRequest {
  int32 page_size = 1;
  string page_token = 2;
}
```

```typescript
// gRPC 서버 구현
import * as grpc from '@grpc/grpc-js';

const userService: grpc.UntypedServiceImplementation = {
  getUser: async (call, callback) => {
    try {
      const user = await UserModel.findById(call.request.id);
      if (!user) {
        return callback({ code: grpc.status.NOT_FOUND, message: 'User not found' });
      }
      callback(null, user.toProto());
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  }
};
```

### OpenAPI/Swagger 문서화

```yaml
# openapi.yaml
openapi: 3.1.0
info:
  title: User Management API
  version: 1.0.0

paths:
  /users:
    get:
      summary: List users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
      security:
        - bearerAuth: []

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
      required: [id, email, name]

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

---

## 데이터베이스 패턴

### SQL (PostgreSQL)

#### 스키마 설계

```sql
-- migrations/001_create_users.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    status user_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- 복합 인덱스
CREATE INDEX idx_users_status_created ON users(status, created_at DESC);

-- 부분 인덱스
CREATE INDEX idx_users_active ON users(email) WHERE status = 'active';

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### 쿼리 최적화

```sql
-- EXPLAIN ANALYZE로 쿼리 성능 분석
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.*, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.status = 'active'
GROUP BY u.id
ORDER BY u.created_at DESC
LIMIT 20;

-- CTE 활용
WITH active_users AS (
    SELECT id, name, email
    FROM users
    WHERE status = 'active'
),
user_orders AS (
    SELECT user_id, COUNT(*) as order_count, SUM(total_amount) as total_spent
    FROM orders WHERE status = 'delivered'
    GROUP BY user_id
)
SELECT au.*, COALESCE(uo.order_count, 0) as order_count
FROM active_users au
LEFT JOIN user_orders uo ON uo.user_id = au.id;

-- Keyset 페이지네이션 (효율적)
SELECT * FROM users
WHERE created_at < '2024-01-15T10:30:00Z'
ORDER BY created_at DESC
LIMIT 20;
```

### NoSQL (MongoDB)

```typescript
// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
  email: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  profile: { bio?: string; avatar?: string };
  tags: string[];
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true, minlength: 2, maxlength: 100 },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active', index: true },
  profile: { bio: String, avatar: String },
  tags: [{ type: String, index: true }]
}, { timestamps: true });

// 인덱스
userSchema.index({ status: 1, createdAt: -1 });
userSchema.index({ 'profile.bio': 'text', name: 'text' });

export const User = mongoose.model<IUser>('User', userSchema);
```

```typescript
// Aggregation Pipeline
const userStats = await User.aggregate([
  { $match: { status: 'active' } },
  { $lookup: { from: 'orders', localField: '_id', foreignField: 'userId', as: 'orders' } },
  { $addFields: { orderCount: { $size: '$orders' }, totalSpent: { $sum: '$orders.totalAmount' } } },
  { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
              userCount: { $sum: 1 }, totalRevenue: { $sum: '$totalSpent' } } },
  { $sort: { '_id.year': -1, '_id.month': -1 } },
  { $limit: 12 }
]);
```

### Redis

```typescript
// redis/client.ts
import Redis from 'ioredis';

const redis = new Redis({ host: process.env.REDIS_HOST, port: 6379 });

class RedisService {
  // JSON 저장
  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const json = JSON.stringify(value);
    ttlSeconds ? await redis.setex(key, ttlSeconds, json) : await redis.set(key, json);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const json = await redis.get(key);
    return json ? JSON.parse(json) : null;
  }

  // 분산 락
  async acquireLock(key: string, ttlMs: number): Promise<string | null> {
    const lockId = crypto.randomUUID();
    const result = await redis.set(`lock:${key}`, lockId, 'PX', ttlMs, 'NX');
    return result === 'OK' ? lockId : null;
  }

  async releaseLock(key: string, lockId: string): Promise<boolean> {
    const script = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;
    return (await redis.eval(script, 1, `lock:${key}`, lockId)) === 1;
  }

  // Rate Limiting (Sliding Window)
  async checkRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const multi = redis.multi();
    multi.zremrangebyscore(key, 0, now - windowSeconds * 1000);
    multi.zadd(key, now, `${now}`);
    multi.zcard(key);
    multi.expire(key, windowSeconds);
    const results = await multi.exec();
    const count = results![2][1] as number;
    return { allowed: count <= maxRequests, remaining: Math.max(0, maxRequests - count) };
  }
}

export const redisService = new RedisService();
```

### ORM (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String      @id @default(uuid())
  email         String      @unique
  passwordHash  String      @map("password_hash")
  name          String
  status        UserStatus  @default(ACTIVE)
  profile       Profile?
  orders        Order[]
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  @@index([status, createdAt(sort: Desc)])
  @@map("users")
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}
```

```typescript
// services/UserService.ts
import { PrismaClient, Prisma, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

class UserService {
  async findMany(params: { page?: number; limit?: number; status?: UserStatus; search?: string }) {
    const { page = 1, limit = 20, status, search } = params;
    const where: Prisma.UserWhereInput = {
      ...(status && { status }),
      ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] })
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { profile: true } }),
      prisma.user.count({ where })
    ]);
    return { users, total, page, limit };
  }
}
```

---

## 인증/인가

### JWT (Access/Refresh Token)

```typescript
// auth/jwt.ts
import jwt from 'jsonwebtoken';

interface TokenPayload { userId: string; email: string; role: string; }
interface TokenPair { accessToken: string; refreshToken: string; expiresIn: number; }

export class JWTService {
  async generateTokenPair(payload: TokenPayload): Promise<TokenPair> {
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: payload.userId, tokenId: crypto.randomUUID() },
      process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '7d' });

    await redisService.setString(`refresh:${payload.userId}`, refreshToken, 7 * 24 * 60 * 60);
    return { accessToken, refreshToken, expiresIn: 15 * 60 };
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError(error instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid token');
    }
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as { userId: string };
    const storedToken = await redisService.getString(`refresh:${decoded.userId}`);
    if (storedToken !== refreshToken) throw new UnauthorizedError('Invalid refresh token');

    const user = await userService.findById(decoded.userId);
    return this.generateTokenPair({ userId: user.id, email: user.email, role: user.role });
  }
}

// Middleware
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.substring(7);
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwtService.verifyAccessToken(token);
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};
```

### OAuth 2.0 / OIDC

```typescript
// auth/oauth.ts
import { OAuth2Client } from 'google-auth-library';

export class GoogleOAuth {
  private client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);

  getAuthUrl(state: string): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
      state, prompt: 'consent'
    });
  }

  async getUserInfo(accessToken: string) {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } });
    return { id: response.data.id, email: response.data.email, name: response.data.name, provider: 'google' };
  }
}
```

### RBAC (Role-Based Access Control)

```typescript
// auth/rbac.ts
enum Role { ADMIN = 'admin', MANAGER = 'manager', USER = 'user' }
enum Permission { USER_READ = 'user:read', USER_DELETE = 'user:delete', ADMIN_ACCESS = 'admin:access' }

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.MANAGER]: [Permission.USER_READ],
  [Role.USER]: [Permission.USER_READ]
};

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as Role;
    if (!userRole || !permissions.every(p => rolePermissions[userRole]?.includes(p))) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

### ABAC (Attribute-Based Access Control)

```typescript
// auth/abac.ts
interface PolicyContext {
  user: { id: string; role: string; department?: string };
  resource: { type: string; ownerId?: string };
  action: string;
  environment: { time: Date; ip: string };
}

interface Policy {
  effect: 'allow' | 'deny';
  condition: (ctx: PolicyContext) => boolean;
}

const policies: Policy[] = [
  { effect: 'allow', condition: ctx => ctx.action === 'update' && ctx.resource.ownerId === ctx.user.id },
  { effect: 'allow', condition: ctx => ctx.user.role === 'admin' },
  { effect: 'deny', condition: ctx => { const h = ctx.environment.time.getHours(); return ctx.user.role !== 'admin' && (h < 9 || h >= 18); } }
];

class ABACEngine {
  evaluate(context: PolicyContext): { allowed: boolean; reason?: string } {
    for (const p of policies.filter(p => p.effect === 'deny')) {
      if (p.condition(context)) return { allowed: false, reason: 'Policy denied' };
    }
    for (const p of policies.filter(p => p.effect === 'allow')) {
      if (p.condition(context)) return { allowed: true };
    }
    return { allowed: false, reason: 'No matching allow policy' };
  }
}
```

---

## 마이크로서비스 아키텍처

### 서비스 분리 패턴

```
┌─────────────────────────────────────────────────────┐
│                   API Gateway                       │
└────────────────────┬────────────────────────────────┘
         ┌───────────┼───────────┬───────────┐
         ▼           ▼           ▼           ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
   │  User    │ │  Order   │ │  Product │ │ Payment  │
   │ Service  │ │ Service  │ │ Service  │ │ Service  │
   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
        ▼            ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
   │PostgreSQL│ │PostgreSQL│ │ MongoDB  │ │PostgreSQL│
   └──────────┘ └──────────┘ └──────────┘ └──────────┘
                    │
┌───────────────────┴───────────────────┐
│         Message Broker (Kafka)        │
└───────────────────────────────────────┘
```

### API Gateway 설정 (Kong)

```yaml
# kong.yml
services:
  - name: user-service
    url: http://user-service:3000
    routes:
      - paths: [/api/v1/users]
    plugins:
      - name: rate-limiting
        config: { minute: 100, policy: redis }
      - name: jwt
      - name: cors
        config: { origins: ["https://example.com"] }
```

### 서비스 간 통신 (Circuit Breaker)

```typescript
import CircuitBreaker from 'opossum';

class UserClient {
  private breaker = new CircuitBreaker(
    (userId: string) => this.fetchUser(userId),
    { timeout: 3000, errorThresholdPercentage: 50, resetTimeout: 30000 }
  );

  async getUser(userId: string) {
    try {
      return await this.breaker.fire(userId);
    } catch (error) {
      if (error.message === 'Breaker is open') return this.getUserFromCache(userId);
      throw error;
    }
  }
}
```

### 서비스 디스커버리 (Consul)

```typescript
import Consul from 'consul';

class ServiceDiscovery {
  private consul = new Consul({ host: process.env.CONSUL_HOST });

  async register(service: { name: string; id: string; port: number }) {
    await this.consul.agent.service.register({
      name: service.name, id: service.id, port: service.port,
      check: { http: `http://localhost:${service.port}/health`, interval: '10s' }
    });
  }

  async getService(name: string) {
    const result = await this.consul.health.service({ service: name, passing: true });
    if (!result.length) return null;
    const { Address, Port } = result[Math.floor(Math.random() * result.length)].Service;
    return { address: Address, port: Port };
  }
}
```

---

## 메시지 큐

### Kafka

```typescript
import { Kafka, Producer, Consumer } from 'kafkajs';

const kafka = new Kafka({ clientId: process.env.SERVICE_NAME, brokers: ['localhost:9092'] });

class KafkaProducer {
  private producer: Producer = kafka.producer({ idempotent: true });

  async send<T>(topic: string, message: T, key?: string) {
    await this.producer.send({
      topic,
      messages: [{ key, value: JSON.stringify(message), headers: { 'correlation-id': crypto.randomUUID() } }]
    });
  }
}

class KafkaConsumer {
  private consumer: Consumer;
  private handlers = new Map<string, (msg: any) => Promise<void>>();

  constructor(groupId: string) { this.consumer = kafka.consumer({ groupId }); }

  registerHandler<T>(topic: string, handler: (msg: T) => Promise<void>) { this.handlers.set(topic, handler); }

  async start() {
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const handler = this.handlers.get(topic);
        if (handler) await handler(JSON.parse(message.value?.toString() || '{}'));
      }
    });
  }
}
```

### RabbitMQ

```typescript
import amqp from 'amqplib';

class RabbitMQClient {
  private channel: amqp.Channel | null = null;

  async connect() {
    const conn = await amqp.connect(process.env.RABBITMQ_URL!);
    this.channel = await conn.createChannel();
    await this.channel.prefetch(10);
  }

  async publish<T>(exchange: string, routingKey: string, message: T) {
    this.channel!.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), { persistent: true });
  }

  async consume<T>(queue: string, handler: (msg: T) => Promise<void>) {
    await this.channel!.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        await handler(JSON.parse(msg.content.toString()));
        this.channel!.ack(msg);
      } catch { this.channel!.nack(msg, false, false); }
    });
  }
}
```

---

## 캐싱 전략

### 캐싱 패턴

| 전략 | 설명 | 사용 시점 |
|------|------|----------|
| Cache-Aside | 앱이 캐시 관리 | 범용, 읽기 많은 경우 |
| Write-Through | 쓰기 시 캐시도 동시 갱신 | 일관성 중요 |
| Write-Behind | 캐시 먼저 쓰고 비동기로 DB | 쓰기 성능 중요 |
| Read-Through | 캐시 미스 시 자동 로드 | 단순화 |

```typescript
// Cache-Aside
class CacheAsideStrategy<T> {
  constructor(private prefix: string, private ttl: number, private fetcher: (key: string) => Promise<T | null>) {}

  async get(key: string): Promise<T | null> {
    const cached = await redisService.getJSON<T>(`${this.prefix}:${key}`);
    if (cached) return cached;
    const data = await this.fetcher(key);
    if (data) await redisService.setJSON(`${this.prefix}:${key}`, data, this.ttl);
    return data;
  }
}

// Stampede Protection (Mutex Lock)
class StampedeProtectedCache<T> {
  constructor(private prefix: string, private ttl: number, private fetcher: (key: string) => Promise<T | null>) {}

  async get(key: string): Promise<T | null> {
    const cacheKey = `${this.prefix}:${key}`;
    const cached = await redisService.getJSON<T>(cacheKey);
    if (cached) return cached;

    const lockId = await redisService.acquireLock(cacheKey, 5000);
    if (lockId) {
      try {
        const rechecked = await redisService.getJSON<T>(cacheKey);
        if (rechecked) return rechecked;
        const data = await this.fetcher(key);
        if (data) await redisService.setJSON(cacheKey, data, this.ttl);
        return data;
      } finally { await redisService.releaseLock(cacheKey, lockId); }
    } else {
      await new Promise(r => setTimeout(r, 100));
      return this.get(key);
    }
  }
}
```

### CDN 캐싱 헤더

```typescript
function setCacheHeaders(options: { maxAge?: number; sMaxAge?: number; private?: boolean }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const directives = [options.private ? 'private' : 'public'];
    if (options.maxAge) directives.push(`max-age=${options.maxAge}`);
    if (options.sMaxAge) directives.push(`s-maxage=${options.sMaxAge}`);
    res.setHeader('Cache-Control', directives.join(', '));
    next();
  };
}
```

---

## 보안 베스트 프랙티스

### OWASP Top 10 대응

```typescript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

// 1. Security Headers
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"] } },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));

// 2. Rate Limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/api/auth/login', rateLimit({ windowMs: 60 * 60 * 1000, max: 5, skipSuccessfulRequests: true }));

// 3. NoSQL Injection 방지
app.use(mongoSanitize());

// 4. CORS 설정
app.use(cors({
  origin: ['https://example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
```

### 입력 검증 (Zod)

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
  name: z.string().min(2).max(100).trim()
});

function validate(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      next(error);
    }
  };
}
```

### 비밀번호 해싱 (Argon2)

```typescript
import argon2 from 'argon2';

class PasswordService {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3 });
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
```

---

## 로깅 및 모니터링

### 구조화된 로깅 (Winston)

```typescript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: process.env.SERVICE_NAME },
  transports: [
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) }),
    new DailyRotateFile({ filename: 'logs/app-%DATE%.log', datePattern: 'YYYY-MM-DD', maxFiles: '14d' }),
    new DailyRotateFile({ filename: 'logs/error-%DATE%.log', level: 'error', maxFiles: '30d' })
  ]
});

export const log = {
  info: (msg: string, meta?: object) => logger.info(msg, meta),
  error: (msg: string, err?: Error, meta?: object) => logger.error(msg, { ...meta, error: err?.message, stack: err?.stack }),
  audit: (action: string, userId: string, resource: string) => logger.info(`AUDIT: ${action}`, { userId, resource, timestamp: new Date() })
};
```

### Prometheus 메트릭

```typescript
import promClient from 'prom-client';

promClient.collectDefaultMetrics({ prefix: 'app_' });

const httpRequestsTotal = new promClient.Counter({ name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'path', 'status'] });
const httpRequestDuration = new promClient.Histogram({ name: 'http_request_duration_seconds', help: 'Request duration', labelNames: ['method', 'path'], buckets: [0.01, 0.1, 0.5, 1, 5] });

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    const labels = { method: req.method, path: req.route?.path || req.path, status: res.statusCode.toString() };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });
  next();
};

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

### ELK Stack 통합

```yaml
# docker-compose.elk.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment: [discovery.type=single-node]
    ports: ["9200:9200"]

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports: ["5601:5601"]
    depends_on: [elasticsearch]

  prometheus:
    image: prom/prometheus:latest
    ports: ["9090:9090"]
    volumes: [./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml]

  grafana:
    image: grafana/grafana:latest
    ports: ["3000:3000"]
    depends_on: [prometheus]
```

---

## Rules

1. **API 설계**: REST Level 2 이상 준수, 명확한 리소스 명명
2. **데이터베이스**: 인덱스 최적화, N+1 문제 방지, 트랜잭션 적절히 사용
3. **인증/인가**: JWT는 짧은 만료 시간, Refresh Token으로 갱신
4. **보안**: OWASP Top 10 대응, 입력 검증 필수
5. **에러 처리**: 구조화된 에러 응답, 적절한 HTTP 상태 코드
6. **로깅**: 구조화된 로그, 민감 정보 마스킹
7. **모니터링**: 메트릭 수집, 알림 설정
8. **테스트**: 단위/통합 테스트 필수, 테스트 커버리지 80% 이상

---

## References

- [REST API Design Best Practices](https://restfulapi.net/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [OWASP Top 10](https://owasp.org/Top10/)
- [12 Factor App](https://12factor.net/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
