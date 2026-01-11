# CI/CD Skill

지속적 통합 및 배포 파이프라인을 설계하고 구현합니다.

## Quick Start

```yaml
# GitHub Actions 기본 워크플로우
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  build-test-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test && npm run build
```

---

## 개요 및 목적 (Overview & Purpose)

**CI/CD (Continuous Integration / Continuous Deployment)**는 코드 변경을 자동으로 빌드, 테스트, 배포하는 자동화 프로세스입니다.

### 왜 CI/CD가 필요한가?

1. **빠른 피드백**: 코드 문제를 조기에 발견
2. **일관된 배포**: 수동 오류 제거
3. **높은 품질**: 자동화된 테스트로 품질 보장
4. **빠른 릴리스**: 배포 주기 단축

### 핵심 용어

| 용어 | 설명 |
|------|------|
| **Pipeline** | 빌드-테스트-배포의 자동화된 워크플로우 |
| **Job** | 파이프라인 내의 독립적인 작업 단위 |
| **Stage** | 관련 Job들의 논리적 그룹 (build, test, deploy) |
| **Artifact** | 빌드 결과물 (바이너리, 컨테이너 이미지 등) |
| **Runner** | 파이프라인을 실행하는 컴퓨팅 환경 |
| **Trigger** | 파이프라인 실행을 시작하는 이벤트 |

---

## GitHub Actions 워크플로우 패턴

### 1. 기본 CI 워크플로우

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  lint:
    name: Lint & Format Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linter
        run: pnpm lint

      - name: Check formatting
        run: pnpm format:check

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          retention-days: 7
```

### 2. Matrix 빌드 (다중 환경 테스트)

```yaml
# .github/workflows/matrix-build.yml
name: Matrix Build

on: [push, pull_request]

jobs:
  build:
    name: Build (${{ matrix.os }}, ${{ matrix.arch }})
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        arch: [x64, arm64]
        exclude:
          - os: windows-latest
            arch: arm64
        include:
          - os: ubuntu-latest
            arch: x64
            container: node:20-alpine

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          architecture: ${{ matrix.arch }}

      - name: Install and build
        run: |
          npm ci
          npm run build

      - name: Run platform tests
        run: npm test

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ matrix.os }}-${{ matrix.arch }}
          path: dist/
```

### 3. 조건부 실행 및 수동 트리거

```yaml
# .github/workflows/conditional.yml
name: Conditional Workflow

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'package.json'
      - '.github/workflows/**'
    paths-ignore:
      - '**.md'
      - 'docs/**'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
      skip_tests:
        description: 'Skip tests'
        required: false
        default: false
        type: boolean

jobs:
  prepare:
    runs-on: ubuntu-latest
    outputs:
      should_deploy: ${{ steps.check.outputs.deploy }}
      version: ${{ steps.version.outputs.version }}
    steps:
      - uses: actions/checkout@v4

      - name: Check deployment conditions
        id: check
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            echo "deploy=true" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "deploy=true" >> $GITHUB_OUTPUT
          else
            echo "deploy=false" >> $GITHUB_OUTPUT
          fi

      - name: Get version
        id: version
        run: echo "version=$(cat package.json | jq -r .version)" >> $GITHUB_OUTPUT

  test:
    needs: prepare
    if: ${{ github.event.inputs.skip_tests != 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test

  deploy:
    needs: [prepare, test]
    if: |
      always() &&
      needs.prepare.outputs.should_deploy == 'true' &&
      (needs.test.result == 'success' || needs.test.result == 'skipped')
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'staging' }}
    steps:
      - uses: actions/checkout@v4

      - name: Deploy version ${{ needs.prepare.outputs.version }}
        run: echo "Deploying to ${{ github.event.inputs.environment || 'staging' }}"
```

### 4. 재사용 가능한 워크플로우

```yaml
# .github/workflows/reusable-build.yml
name: Reusable Build Workflow

on:
  workflow_call:
    inputs:
      node-version:
        required: false
        type: string
        default: '20'
      working-directory:
        required: false
        type: string
        default: '.'
      build-command:
        required: false
        type: string
        default: 'npm run build'
    outputs:
      artifact-name:
        description: 'Name of the uploaded artifact'
        value: ${{ jobs.build.outputs.artifact-name }}
    secrets:
      NPM_TOKEN:
        required: false

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact-name: ${{ steps.upload.outputs.artifact-name }}
    defaults:
      run:
        working-directory: ${{ inputs.working-directory }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'npm'
          cache-dependency-path: ${{ inputs.working-directory }}/package-lock.json

      - name: Install dependencies
        run: npm ci
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Build
        run: ${{ inputs.build-command }}

      - name: Upload artifact
        id: upload
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ github.sha }}
          path: ${{ inputs.working-directory }}/dist/

# 호출하는 워크플로우
# .github/workflows/caller.yml
name: Main Pipeline

on: [push]

jobs:
  build-frontend:
    uses: ./.github/workflows/reusable-build.yml
    with:
      working-directory: 'packages/frontend'
      build-command: 'npm run build:prod'
    secrets:
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

  build-backend:
    uses: ./.github/workflows/reusable-build.yml
    with:
      working-directory: 'packages/backend'
```

---

## GitLab CI/CD 파이프라인

### 1. 기본 파이프라인 구조

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - build
  - test
  - security
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  NODE_VERSION: "20"

default:
  image: node:${NODE_VERSION}-alpine
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - node_modules/
    policy: pull-push

# 템플릿 정의
.node-setup:
  before_script:
    - npm ci --cache .npm --prefer-offline
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - node_modules/
      - .npm/

# Validate Stage
lint:
  stage: validate
  extends: .node-setup
  script:
    - npm run lint
    - npm run format:check
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

# Build Stage
build:
  stage: build
  extends: .node-setup
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
  rules:
    - if: $CI_COMMIT_BRANCH

# Test Stage
unit-tests:
  stage: test
  extends: .node-setup
  script:
    - npm run test:coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    when: always
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

integration-tests:
  stage: test
  extends: .node-setup
  services:
    - postgres:15
    - redis:7-alpine
  variables:
    POSTGRES_DB: test_db
    POSTGRES_USER: test_user
    POSTGRES_PASSWORD: test_pass
    DATABASE_URL: "postgresql://test_user:test_pass@postgres:5432/test_db"
    REDIS_URL: "redis://redis:6379"
  script:
    - npm run test:integration
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: manual
      allow_failure: true

# Security Stage
sast:
  stage: security
  image: returntocorp/semgrep
  script:
    - semgrep --config=auto --json -o semgrep-report.json .
  artifacts:
    reports:
      sast: semgrep-report.json
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

dependency-scan:
  stage: security
  extends: .node-setup
  script:
    - npm audit --audit-level=high --json > npm-audit.json || true
    - npx better-npm-audit audit --level high
  artifacts:
    paths:
      - npm-audit.json
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  allow_failure: true

# Deploy Stage
deploy-staging:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - echo "Deploying to staging..."
    - curl -X POST $DEPLOY_WEBHOOK_STAGING
  environment:
    name: staging
    url: https://staging.example.com
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual

deploy-production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - echo "Deploying to production..."
    - curl -X POST $DEPLOY_WEBHOOK_PRODUCTION
  environment:
    name: production
    url: https://example.com
  rules:
    - if: $CI_COMMIT_TAG
  when: manual
  allow_failure: false
```

### 2. 동적 파이프라인 (Child Pipeline)

```yaml
# .gitlab-ci.yml
stages:
  - generate
  - trigger

generate-config:
  stage: generate
  image: python:3.11-slim
  script:
    - python scripts/generate-pipeline.py > generated-pipeline.yml
  artifacts:
    paths:
      - generated-pipeline.yml

trigger-dynamic:
  stage: trigger
  trigger:
    include:
      - artifact: generated-pipeline.yml
        job: generate-config
    strategy: depend
```

```python
# scripts/generate-pipeline.py
import os
import yaml

def generate_pipeline():
    # 변경된 디렉토리 감지
    changed_dirs = os.popen("git diff --name-only HEAD~1 | cut -d'/' -f1 | sort -u").read().strip().split('\n')

    jobs = {}

    for dir in changed_dirs:
        if os.path.exists(f"{dir}/package.json"):
            jobs[f"build-{dir}"] = {
                "stage": "build",
                "script": [f"cd {dir} && npm ci && npm run build"],
                "artifacts": {
                    "paths": [f"{dir}/dist/"]
                }
            }

    pipeline = {
        "stages": ["build", "test"],
        **jobs
    }

    print(yaml.dump(pipeline, default_flow_style=False))

if __name__ == "__main__":
    generate_pipeline()
```

### 3. 다중 프로젝트 파이프라인

```yaml
# .gitlab-ci.yml
stages:
  - build
  - downstream

build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/

trigger-deploy-pipeline:
  stage: downstream
  trigger:
    project: devops/deploy-configs
    branch: main
    strategy: depend
  variables:
    UPSTREAM_PROJECT: $CI_PROJECT_PATH
    UPSTREAM_SHA: $CI_COMMIT_SHA
    UPSTREAM_REF: $CI_COMMIT_REF_NAME

trigger-e2e-tests:
  stage: downstream
  trigger:
    project: qa/e2e-tests
    strategy: depend
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

---

## Docker 빌드 최적화

### 1. 멀티 스테이지 빌드

```dockerfile
# Dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# 의존성 파일만 먼저 복사 (캐시 활용)
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 보안: non-root 사용자
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# 프로덕션 의존성만 복사
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

USER appuser

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### 2. GitHub Actions에서 Docker 빌드

```yaml
# .github/workflows/docker.yml
name: Docker Build & Push

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix=,suffix=,format=short

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=${{ github.event.repository.updated_at }}
            VCS_REF=${{ github.sha }}
```

### 3. GitLab CI에서 Docker 빌드

```yaml
# .gitlab-ci.yml
variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

build-image:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_BUILDKIT: 1
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - |
      docker build \
        --cache-from $CI_REGISTRY_IMAGE:latest \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA \
        --tag $CI_REGISTRY_IMAGE:latest \
        .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

### 4. Docker Layer 캐싱 전략

```dockerfile
# 최적화된 Dockerfile 예시
FROM node:20-alpine AS base

# 1. 시스템 의존성 (거의 변경 없음)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 2. 패키지 매니저 설정 (거의 변경 없음)
COPY package.json package-lock.json ./

# 3. 의존성 설치 (package.json 변경 시에만)
FROM base AS deps
RUN npm ci

# 4. 개발 의존성 포함 빌드
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 5. 프로덕션 의존성만
FROM base AS prod-deps
RUN npm ci --only=production

# 6. 최종 이미지
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index.js"]
```

---

## 테스트 자동화 전략

### 1. 테스트 피라미드 구현

```yaml
# .github/workflows/test-pyramid.yml
name: Test Pyramid

on: [push, pull_request]

jobs:
  # Layer 1: Unit Tests (가장 많이, 가장 빠르게)
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit
        env:
          CI: true

  # Layer 2: Integration Tests
  integration-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  # Layer 3: E2E Tests (가장 적게, 가장 느리게)
  e2e-tests:
    needs: integration-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Start application
        run: npm run start:test &
        env:
          NODE_ENV: test

      - name: Wait for app
        run: npx wait-on http://localhost:3000 -t 60000

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### 2. 병렬 테스트 실행

```yaml
# .github/workflows/parallel-tests.yml
name: Parallel Tests

on: [push]

jobs:
  prepare:
    runs-on: ubuntu-latest
    outputs:
      test-chunks: ${{ steps.set-chunks.outputs.chunks }}
    steps:
      - uses: actions/checkout@v4
      - id: set-chunks
        run: |
          # 테스트 파일을 청크로 분할
          files=$(find tests -name "*.test.ts" | sort)
          chunks=$(echo "$files" | jq -R -s -c 'split("\n") | map(select(length > 0)) | [., length] | .[0] as $arr | [range(0; 4)] | map($arr[. * (($arr | length) / 4 | floor):((. + 1) * (($arr | length) / 4 | floor))])')
          echo "chunks=$chunks" >> $GITHUB_OUTPUT

  test:
    needs: prepare
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        chunk: [0, 1, 2, 3]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci

      - name: Run test chunk ${{ matrix.chunk }}
        run: |
          files='${{ toJson(fromJson(needs.prepare.outputs.test-chunks)[matrix.chunk]) }}'
          echo "Running tests: $files"
          echo "$files" | jq -r '.[]' | xargs npm run test --

  merge-coverage:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Download all coverage reports
        uses: actions/download-artifact@v4
        with:
          pattern: coverage-*
          merge-multiple: true
          path: coverage/

      - name: Merge coverage
        run: npx nyc merge coverage/ merged-coverage.json

      - name: Upload to Codecov
        uses: codecov/codecov-action@v4
```

### 3. 테스트 결과 리포팅

```yaml
# .github/workflows/test-reporting.yml
name: Test with Reporting

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci

      - name: Run tests with coverage
        run: npm run test:ci
        continue-on-error: true

      - name: Test Report
        uses: dorny/test-reporter@v1
        if: success() || failure()
        with:
          name: Jest Tests
          path: junit.xml
          reporter: jest-junit

      - name: Coverage Report
        uses: irongut/CodeCoverageSummary@v1.3.0
        with:
          filename: coverage/cobertura-coverage.xml
          badge: true
          format: markdown
          output: both

      - name: Add Coverage PR Comment
        uses: marocchino/sticky-pull-request-comment@v2
        if: github.event_name == 'pull_request'
        with:
          recreate: true
          path: code-coverage-results.md
```

---

## 배포 전략 (Deployment Strategies)

### 1. Blue-Green 배포

```yaml
# .github/workflows/blue-green-deploy.yml
name: Blue-Green Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2

      - name: Determine current environment
        id: current
        run: |
          current=$(aws elbv2 describe-target-groups \
            --names "${{ github.event.inputs.environment }}-active" \
            --query 'TargetGroups[0].TargetGroupArn' \
            --output text)

          if [[ "$current" == *"blue"* ]]; then
            echo "current=blue" >> $GITHUB_OUTPUT
            echo "target=green" >> $GITHUB_OUTPUT
          else
            echo "current=green" >> $GITHUB_OUTPUT
            echo "target=blue" >> $GITHUB_OUTPUT
          fi

      - name: Deploy to inactive environment
        run: |
          echo "Deploying to ${{ steps.current.outputs.target }}"
          aws ecs update-service \
            --cluster ${{ github.event.inputs.environment }} \
            --service app-${{ steps.current.outputs.target }} \
            --task-definition app:${{ github.sha }} \
            --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster ${{ github.event.inputs.environment }} \
            --services app-${{ steps.current.outputs.target }}

      - name: Run smoke tests
        run: |
          target_url="https://${{ steps.current.outputs.target }}.${{ github.event.inputs.environment }}.example.com"
          curl -f "$target_url/health" || exit 1

      - name: Switch traffic
        run: |
          # ALB 리스너 규칙 업데이트로 트래픽 전환
          aws elbv2 modify-listener \
            --listener-arn ${{ secrets.ALB_LISTENER_ARN }} \
            --default-actions Type=forward,TargetGroupArn=${{ steps.current.outputs.target }}-tg-arn

      - name: Verify switch
        run: |
          sleep 30
          curl -f "https://${{ github.event.inputs.environment }}.example.com/health"
```

### 2. Canary 배포

```yaml
# .github/workflows/canary-deploy.yml
name: Canary Deployment

on:
  workflow_dispatch:
    inputs:
      canary_percentage:
        description: 'Initial canary traffic percentage'
        required: true
        default: '10'
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  canary-deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2

      - name: Deploy canary version
        id: canary
        run: |
          # 새 태스크 정의 배포
          aws ecs register-task-definition \
            --family app-canary \
            --container-definitions file://task-definition.json

          aws ecs update-service \
            --cluster ${{ github.event.inputs.environment }} \
            --service app-canary \
            --task-definition app-canary \
            --desired-count 1

      - name: Configure traffic split
        run: |
          # ALB 가중치 기반 라우팅 설정
          aws elbv2 modify-rule \
            --rule-arn ${{ secrets.ALB_RULE_ARN }} \
            --actions '[
              {
                "Type": "forward",
                "ForwardConfig": {
                  "TargetGroups": [
                    {"TargetGroupArn": "${{ secrets.STABLE_TG_ARN }}", "Weight": $((100 - ${{ github.event.inputs.canary_percentage }}))},
                    {"TargetGroupArn": "${{ secrets.CANARY_TG_ARN }}", "Weight": ${{ github.event.inputs.canary_percentage }}}
                  ]
                }
              }
            ]'

      - name: Monitor canary metrics
        id: monitor
        run: |
          # 10분간 메트릭 모니터링
          for i in {1..10}; do
            sleep 60

            error_rate=$(aws cloudwatch get-metric-statistics \
              --namespace "AWS/ApplicationELB" \
              --metric-name "HTTPCode_Target_5XX_Count" \
              --dimensions Name=TargetGroup,Value=canary-tg \
              --start-time $(date -u -d '1 minute ago' +%Y-%m-%dT%H:%M:%SZ) \
              --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
              --period 60 \
              --statistics Sum \
              --query 'Datapoints[0].Sum' \
              --output text)

            if [[ "$error_rate" != "None" && "$error_rate" -gt 10 ]]; then
              echo "status=failed" >> $GITHUB_OUTPUT
              exit 1
            fi

            echo "Minute $i: Error rate = $error_rate"
          done

          echo "status=success" >> $GITHUB_OUTPUT

      - name: Progressive rollout
        if: steps.monitor.outputs.status == 'success'
        run: |
          for percentage in 25 50 75 100; do
            echo "Increasing canary traffic to $percentage%"

            aws elbv2 modify-rule \
              --rule-arn ${{ secrets.ALB_RULE_ARN }} \
              --actions '[
                {
                  "Type": "forward",
                  "ForwardConfig": {
                    "TargetGroups": [
                      {"TargetGroupArn": "${{ secrets.STABLE_TG_ARN }}", "Weight": '$((100 - percentage))'},
                      {"TargetGroupArn": "${{ secrets.CANARY_TG_ARN }}", "Weight": '$percentage'}
                    ]
                  }
                }
              ]'

            sleep 120  # 2분 대기
          done

      - name: Rollback on failure
        if: failure() || steps.monitor.outputs.status == 'failed'
        run: |
          echo "Rolling back canary deployment"

          # 모든 트래픽을 stable로 복원
          aws elbv2 modify-rule \
            --rule-arn ${{ secrets.ALB_RULE_ARN }} \
            --actions '[
              {
                "Type": "forward",
                "ForwardConfig": {
                  "TargetGroups": [
                    {"TargetGroupArn": "${{ secrets.STABLE_TG_ARN }}", "Weight": 100},
                    {"TargetGroupArn": "${{ secrets.CANARY_TG_ARN }}", "Weight": 0}
                  ]
                }
              }
            ]'
```

### 3. Rolling 배포

```yaml
# .github/workflows/rolling-deploy.yml
name: Rolling Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/setup-kubectl@v3

      - name: Set kubeconfig
        run: |
          echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig

      - name: Update deployment image
        run: |
          kubectl set image deployment/app \
            app=${{ secrets.REGISTRY }}/app:${{ github.sha }} \
            --record

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/app --timeout=10m

      - name: Verify deployment
        run: |
          # 모든 파드가 정상인지 확인
          kubectl get pods -l app=app -o jsonpath='{.items[*].status.phase}' | tr ' ' '\n' | sort -u | grep -v Running && exit 1 || true
```

### 배포 전략 비교

| 전략 | 장점 | 단점 | 적합한 상황 |
|------|------|------|------------|
| **Blue-Green** | 즉시 롤백, 완전한 테스트 환경 | 인프라 비용 2배 | 미션 크리티컬 서비스 |
| **Canary** | 점진적 위험 감소, 실 트래픽 테스트 | 구현 복잡, 모니터링 필수 | 대규모 트래픽 서비스 |
| **Rolling** | 리소스 효율적, 단순함 | 롤백 느림, 버전 혼재 | 일반적인 서비스 |
| **Recreate** | 가장 단순 | 다운타임 발생 | 개발/테스트 환경 |

---

## 환경 변수 및 시크릿 관리

### 1. GitHub Actions 시크릿 관리

```yaml
# .github/workflows/secrets-management.yml
name: Secrets Management

on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # 환경별 시크릿 사용
    steps:
      - uses: actions/checkout@v4

      # 레벨별 시크릿 우선순위:
      # 1. Environment secrets (가장 높음)
      # 2. Repository secrets
      # 3. Organization secrets (가장 낮음)

      - name: Use secrets
        env:
          # 직접 참조
          API_KEY: ${{ secrets.API_KEY }}
          # 환경별 시크릿
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          # 조건부 시크릿
          DEBUG: ${{ github.ref == 'refs/heads/main' && 'false' || 'true' }}
        run: |
          echo "Deploying with configured secrets"

      # AWS Secrets Manager 통합
      - name: Get secrets from AWS
        uses: aws-actions/aws-secretsmanager-get-secrets@v1
        with:
          secret-ids: |
            prod/app/secrets
          parse-json-secrets: true

      # HashiCorp Vault 통합
      - name: Import Secrets from Vault
        uses: hashicorp/vault-action@v2
        with:
          url: https://vault.example.com
          token: ${{ secrets.VAULT_TOKEN }}
          secrets: |
            secret/data/prod/db password | DB_PASSWORD ;
            secret/data/prod/api key | API_SECRET
```

### 2. GitLab CI 변수 관리

```yaml
# .gitlab-ci.yml
variables:
  # 일반 변수 (로그에 노출됨)
  NODE_ENV: production
  LOG_LEVEL: info

deploy:
  stage: deploy
  script:
    # 마스킹된 변수 (로그에서 ***로 표시)
    - echo "Using API_KEY: $API_KEY"  # 출력: Using API_KEY: ***

    # 파일 타입 변수 (인증서 등)
    - cp $SSL_CERTIFICATE /etc/ssl/cert.pem

    # 환경별 변수
    - echo "Database: $DATABASE_URL"
  environment:
    name: production
  variables:
    # Job 레벨 변수
    DEPLOY_TARGET: kubernetes
```

### 3. 환경별 설정 파일 관리

```yaml
# .github/workflows/env-config.yml
name: Environment Configuration

on:
  push:
    branches: [main, staging, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set environment
        id: env
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "env=production" >> $GITHUB_OUTPUT
            echo "config_file=.env.production" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/staging" ]]; then
            echo "env=staging" >> $GITHUB_OUTPUT
            echo "config_file=.env.staging" >> $GITHUB_OUTPUT
          else
            echo "env=development" >> $GITHUB_OUTPUT
            echo "config_file=.env.development" >> $GITHUB_OUTPUT
          fi

      - name: Create config from template
        run: |
          envsubst < config/template.env > ${{ steps.env.outputs.config_file }}
        env:
          API_URL: ${{ vars.API_URL }}
          API_KEY: ${{ secrets.API_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Encrypt sensitive config
        run: |
          # SOPS를 사용한 설정 파일 암호화
          sops --encrypt --age ${{ secrets.SOPS_AGE_KEY }} \
            ${{ steps.env.outputs.config_file }} > config.enc.yaml
```

### 4. 시크릿 로테이션 자동화

```yaml
# .github/workflows/secret-rotation.yml
name: Secret Rotation

on:
  schedule:
    - cron: '0 0 1 * *'  # 매월 1일
  workflow_dispatch:

jobs:
  rotate-secrets:
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2

      - name: Rotate database password
        run: |
          # 새 비밀번호 생성
          new_password=$(openssl rand -base64 32)

          # RDS 비밀번호 변경
          aws rds modify-db-instance \
            --db-instance-identifier prod-db \
            --master-user-password "$new_password" \
            --apply-immediately

          # Secrets Manager 업데이트
          aws secretsmanager put-secret-value \
            --secret-id prod/db/password \
            --secret-string "$new_password"

      - name: Update GitHub secret
        env:
          GH_TOKEN: ${{ secrets.ADMIN_TOKEN }}
        run: |
          # GitHub CLI로 시크릿 업데이트
          gh secret set DATABASE_PASSWORD \
            --body "$new_password" \
            --repo ${{ github.repository }}

      - name: Notify team
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Database password rotated successfully"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 모니터링 및 알림 설정

### 1. 배포 상태 모니터링

```yaml
# .github/workflows/deploy-monitoring.yml
name: Deploy with Monitoring

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start deployment tracking
        id: deployment
        uses: bobheadxi/deployments@v1
        with:
          step: start
          token: ${{ secrets.GITHUB_TOKEN }}
          env: production

      - name: Deploy application
        id: deploy
        run: |
          # 배포 로직
          echo "Deploying..."

      - name: Update deployment status
        uses: bobheadxi/deployments@v1
        if: always()
        with:
          step: finish
          token: ${{ secrets.GITHUB_TOKEN }}
          status: ${{ job.status }}
          deployment_id: ${{ steps.deployment.outputs.deployment_id }}
          env_url: https://example.com

      - name: Create Datadog event
        if: success()
        run: |
          curl -X POST "https://api.datadoghq.com/api/v1/events" \
            -H "DD-API-KEY: ${{ secrets.DATADOG_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "title": "Deployment completed",
              "text": "Version ${{ github.sha }} deployed to production",
              "tags": ["env:production", "service:app"],
              "alert_type": "success"
            }'
```

### 2. Slack 알림 통합

```yaml
# .github/workflows/notifications.yml
name: Build with Notifications

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build
        id: build
        run: npm run build

      - name: Notify Slack on success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Build Successful* :white_check_mark:\n*Repository:* ${{ github.repository }}\n*Branch:* ${{ github.ref_name }}\n*Commit:* `${{ github.sha }}`\n*Author:* ${{ github.actor }}"
                  }
                },
                {
                  "type": "actions",
                  "elements": [
                    {
                      "type": "button",
                      "text": {"type": "plain_text", "text": "View Run"},
                      "url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                    }
                  ]
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK

      - name: Notify Slack on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Build Failed* :x:\n*Repository:* ${{ github.repository }}\n*Branch:* ${{ github.ref_name }}\n*Commit:* `${{ github.sha }}`\n*Author:* ${{ github.actor }}"
                  }
                },
                {
                  "type": "context",
                  "elements": [
                    {
                      "type": "mrkdwn",
                      "text": "<@${{ secrets.SLACK_ONCALL_USER }}> please investigate"
                    }
                  ]
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK
```

### 3. PR 체크 및 상태 배지

```yaml
# .github/workflows/pr-checks.yml
name: PR Quality Gates

on:
  pull_request:
    branches: [main]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      checks: write
    steps:
      - uses: actions/checkout@v4

      - name: Run checks
        id: checks
        run: |
          npm ci
          npm run lint 2>&1 | tee lint-output.txt
          npm run test:coverage 2>&1 | tee test-output.txt

          # 결과 파싱
          lint_errors=$(grep -c "error" lint-output.txt || echo "0")
          coverage=$(grep "All files" test-output.txt | awk '{print $10}' | tr -d '%')

          echo "lint_errors=$lint_errors" >> $GITHUB_OUTPUT
          echo "coverage=$coverage" >> $GITHUB_OUTPUT

      - name: Post PR comment
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          message: |
            ## Quality Gate Results

            | Metric | Value | Status |
            |--------|-------|--------|
            | Lint Errors | ${{ steps.checks.outputs.lint_errors }} | ${{ steps.checks.outputs.lint_errors == '0' && ':white_check_mark:' || ':x:' }} |
            | Coverage | ${{ steps.checks.outputs.coverage }}% | ${{ steps.checks.outputs.coverage >= 80 && ':white_check_mark:' || ':warning:' }} |

            ---
            _Updated at ${{ github.event.pull_request.updated_at }}_

      - name: Create check run
        uses: LouisBrunner/checks-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          name: Quality Gate
          conclusion: ${{ steps.checks.outputs.lint_errors == '0' && steps.checks.outputs.coverage >= 80 && 'success' || 'failure' }}
          output: |
            {"summary": "Lint errors: ${{ steps.checks.outputs.lint_errors }}, Coverage: ${{ steps.checks.outputs.coverage }}%"}
```

### 4. 메트릭 수집 및 대시보드

```yaml
# .github/workflows/metrics.yml
name: Collect Pipeline Metrics

on:
  workflow_run:
    workflows: ["CI", "Deploy"]
    types: [completed]

jobs:
  collect-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Calculate metrics
        id: metrics
        run: |
          # 워크플로우 실행 시간 계산
          run_info=$(gh api repos/${{ github.repository }}/actions/runs/${{ github.event.workflow_run.id }})

          started=$(echo $run_info | jq -r '.run_started_at')
          completed=$(echo $run_info | jq -r '.updated_at')

          duration=$(($(date -d "$completed" +%s) - $(date -d "$started" +%s)))

          echo "duration=$duration" >> $GITHUB_OUTPUT
          echo "conclusion=${{ github.event.workflow_run.conclusion }}" >> $GITHUB_OUTPUT
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Send to Prometheus Pushgateway
        run: |
          cat <<EOF | curl --data-binary @- http://pushgateway.example.com/metrics/job/github_actions/workflow/${{ github.event.workflow.name }}
          # TYPE github_workflow_duration_seconds gauge
          github_workflow_duration_seconds{repo="${{ github.repository }}",workflow="${{ github.event.workflow.name }}",conclusion="${{ steps.metrics.outputs.conclusion }}"} ${{ steps.metrics.outputs.duration }}
          # TYPE github_workflow_runs_total counter
          github_workflow_runs_total{repo="${{ github.repository }}",workflow="${{ github.event.workflow.name }}",conclusion="${{ steps.metrics.outputs.conclusion }}"} 1
          EOF

      - name: Send to InfluxDB
        run: |
          curl -i -XPOST 'http://influxdb.example.com:8086/write?db=cicd' \
            --data-binary "workflow_run,repo=${{ github.repository }},workflow=${{ github.event.workflow.name }},conclusion=${{ steps.metrics.outputs.conclusion }} duration=${{ steps.metrics.outputs.duration }}"
```

---

## 롤백 전략

### 1. 자동 롤백

```yaml
# .github/workflows/auto-rollback.yml
name: Deploy with Auto-Rollback

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2  # 이전 커밋 접근을 위해

      - name: Get previous version
        id: previous
        run: |
          prev_sha=$(git rev-parse HEAD~1)
          echo "sha=$prev_sha" >> $GITHUB_OUTPUT

      - name: Deploy new version
        id: deploy
        run: |
          kubectl set image deployment/app app=registry/app:${{ github.sha }}
          kubectl rollout status deployment/app --timeout=5m
        continue-on-error: true

      - name: Health check
        id: health
        if: steps.deploy.outcome == 'success'
        run: |
          for i in {1..10}; do
            if curl -sf https://example.com/health; then
              echo "Health check passed"
              exit 0
            fi
            sleep 10
          done
          echo "Health check failed"
          exit 1
        continue-on-error: true

      - name: Auto rollback on failure
        if: steps.deploy.outcome == 'failure' || steps.health.outcome == 'failure'
        run: |
          echo "Deployment failed, rolling back to ${{ steps.previous.outputs.sha }}"

          kubectl rollout undo deployment/app
          kubectl rollout status deployment/app --timeout=5m

      - name: Notify rollback
        if: steps.deploy.outcome == 'failure' || steps.health.outcome == 'failure'
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": ":warning: Automatic rollback executed for ${{ github.repository }}\nFailed commit: ${{ github.sha }}\nRolled back to: ${{ steps.previous.outputs.sha }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 2. 수동 롤백 워크플로우

```yaml
# .github/workflows/manual-rollback.yml
name: Manual Rollback

on:
  workflow_dispatch:
    inputs:
      target_version:
        description: 'Version/commit to rollback to (SHA or tag)'
        required: true
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
      reason:
        description: 'Reason for rollback'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.target_version }}

      - name: Verify version exists
        run: |
          if ! git cat-file -e ${{ github.event.inputs.target_version }}^{commit} 2>/dev/null; then
            echo "Error: Version ${{ github.event.inputs.target_version }} not found"
            exit 1
          fi

      - name: Create rollback record
        run: |
          echo "Rollback initiated" >> rollback-log.txt
          echo "From: $(git rev-parse HEAD)" >> rollback-log.txt
          echo "To: ${{ github.event.inputs.target_version }}" >> rollback-log.txt
          echo "By: ${{ github.actor }}" >> rollback-log.txt
          echo "Reason: ${{ github.event.inputs.reason }}" >> rollback-log.txt
          echo "Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> rollback-log.txt

      - name: Deploy rollback version
        run: |
          kubectl set image deployment/app \
            app=registry/app:${{ github.event.inputs.target_version }}
          kubectl rollout status deployment/app

      - name: Verify rollback
        run: |
          deployed_version=$(kubectl get deployment/app -o jsonpath='{.spec.template.spec.containers[0].image}' | cut -d: -f2)
          if [[ "$deployed_version" != "${{ github.event.inputs.target_version }}" ]]; then
            echo "Rollback verification failed"
            exit 1
          fi

      - name: Create incident ticket
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `[ROLLBACK] ${context.payload.inputs.environment}: Rolled back to ${context.payload.inputs.target_version}`,
              body: `## Rollback Details\n\n- **Environment:** ${context.payload.inputs.environment}\n- **Target Version:** ${context.payload.inputs.target_version}\n- **Initiated By:** ${context.actor}\n- **Reason:** ${context.payload.inputs.reason}\n\n## Action Items\n\n- [ ] Investigate root cause\n- [ ] Create fix PR\n- [ ] Document incident`,
              labels: ['incident', 'rollback']
            })
```

### 3. 데이터베이스 마이그레이션 롤백

```yaml
# .github/workflows/db-rollback.yml
name: Database Migration with Rollback

on:
  workflow_dispatch:
    inputs:
      action:
        description: 'Action to perform'
        required: true
        type: choice
        options:
          - migrate
          - rollback
      steps:
        description: 'Number of steps to rollback (for rollback action)'
        required: false
        default: '1'

jobs:
  database:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Setup database tools
        run: |
          npm install -g prisma

      - name: Create backup before migration
        if: github.event.inputs.action == 'migrate'
        run: |
          pg_dump $DATABASE_URL > backup-$(date +%Y%m%d%H%M%S).sql

          # S3에 백업 업로드
          aws s3 cp backup-*.sql s3://backups/db/
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Run migration
        if: github.event.inputs.action == 'migrate'
        run: |
          npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Rollback migration
        if: github.event.inputs.action == 'rollback'
        run: |
          # 지정된 스텝 수만큼 롤백
          for i in $(seq 1 ${{ github.event.inputs.steps }}); do
            npx prisma migrate rollback
          done
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Verify database state
        run: |
          npx prisma migrate status
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## 워크플로우 템플릿 예제

### 1. 완전한 Monorepo CI/CD

```yaml
# .github/workflows/monorepo-cicd.yml
name: Monorepo CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # 변경된 패키지 감지
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.filter.outputs.changes }}
      api-changed: ${{ steps.filter.outputs.api }}
      web-changed: ${{ steps.filter.outputs.web }}
      shared-changed: ${{ steps.filter.outputs.shared }}
    steps:
      - uses: actions/checkout@v4

      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            api:
              - 'packages/api/**'
              - 'packages/shared/**'
            web:
              - 'packages/web/**'
              - 'packages/shared/**'
            shared:
              - 'packages/shared/**'

  # 공유 라이브러리 빌드
  build-shared:
    needs: detect-changes
    if: needs.detect-changes.outputs.shared-changed == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build shared
        run: npm run build -w packages/shared

      - name: Upload shared build
        uses: actions/upload-artifact@v4
        with:
          name: shared-build
          path: packages/shared/dist/

  # API 빌드 및 테스트
  build-api:
    needs: [detect-changes, build-shared]
    if: |
      always() &&
      needs.detect-changes.outputs.api-changed == 'true' &&
      (needs.build-shared.result == 'success' || needs.build-shared.result == 'skipped')
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Download shared build
        if: needs.build-shared.result == 'success'
        uses: actions/download-artifact@v4
        with:
          name: shared-build
          path: packages/shared/dist/

      - name: Install and build
        run: |
          npm ci
          npm run build -w packages/api

      - name: Run tests
        run: npm run test -w packages/api
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

      - name: Build Docker image
        run: |
          docker build -t api:${{ github.sha }} -f packages/api/Dockerfile .

  # Web 빌드 및 테스트
  build-web:
    needs: [detect-changes, build-shared]
    if: |
      always() &&
      needs.detect-changes.outputs.web-changed == 'true' &&
      (needs.build-shared.result == 'success' || needs.build-shared.result == 'skipped')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Download shared build
        if: needs.build-shared.result == 'success'
        uses: actions/download-artifact@v4
        with:
          name: shared-build
          path: packages/shared/dist/

      - name: Install and build
        run: |
          npm ci
          npm run build -w packages/web

      - name: Run tests
        run: npm run test -w packages/web

      - name: Upload build
        uses: actions/upload-artifact@v4
        with:
          name: web-build
          path: packages/web/dist/

  # 배포
  deploy:
    needs: [build-api, build-web]
    if: |
      always() &&
      github.ref == 'refs/heads/main' &&
      (needs.build-api.result == 'success' || needs.build-api.result == 'skipped') &&
      (needs.build-web.result == 'success' || needs.build-web.result == 'skipped')
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy API
        if: needs.build-api.result == 'success'
        run: echo "Deploying API..."

      - name: Deploy Web
        if: needs.build-web.result == 'success'
        run: echo "Deploying Web..."
```

### 2. 릴리스 자동화

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://npm.pkg.github.com'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Semantic Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx semantic-release

# .releaserc.json
# {
#   "branches": ["main"],
#   "plugins": [
#     "@semantic-release/commit-analyzer",
#     "@semantic-release/release-notes-generator",
#     "@semantic-release/changelog",
#     "@semantic-release/npm",
#     ["@semantic-release/github", {
#       "assets": [{"path": "dist/*.zip", "label": "Distribution"}]
#     }],
#     ["@semantic-release/git", {
#       "assets": ["CHANGELOG.md", "package.json"],
#       "message": "chore(release): ${nextRelease.version}"
#     }]
#   ]
# }
```

### 3. 인프라 as Code (Terraform)

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  push:
    branches: [main]
    paths:
      - 'infrastructure/**'
  pull_request:
    branches: [main]
    paths:
      - 'infrastructure/**'

env:
  TF_VERSION: '1.6.0'
  TF_WORKING_DIR: 'infrastructure'

jobs:
  plan:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}
          cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}

      - name: Terraform Init
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform init

      - name: Terraform Validate
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform validate

      - name: Terraform Plan
        id: plan
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform plan -no-color -out=tfplan
        continue-on-error: true

      - name: Comment PR with Plan
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            const output = `#### Terraform Plan 📖

            \`\`\`
            ${{ steps.plan.outputs.stdout }}
            \`\`\`

            *Pushed by: @${{ github.actor }}*`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            })

      - name: Upload Plan
        uses: actions/upload-artifact@v4
        with:
          name: tfplan
          path: ${{ env.TF_WORKING_DIR }}/tfplan

  apply:
    needs: plan
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}
          cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}

      - name: Download Plan
        uses: actions/download-artifact@v4
        with:
          name: tfplan
          path: ${{ env.TF_WORKING_DIR }}

      - name: Terraform Init
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform init

      - name: Terraform Apply
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform apply -auto-approve tfplan
```

---

## Best Practices

### 파이프라인 설계

1. **실패 빠르게**: 가장 빠른 검사를 먼저 실행 (lint > unit test > integration test)
2. **병렬화**: 독립적인 작업은 병렬로 실행
3. **캐싱 활용**: 의존성, 빌드 결과물 캐싱
4. **재사용**: 공통 로직은 재사용 가능한 워크플로우로 분리

### 보안

1. **최소 권한**: 필요한 최소한의 권한만 부여
2. **시크릿 관리**: 하드코딩 금지, 전용 시크릿 매니저 사용
3. **종속성 스캔**: 정기적인 보안 취약점 검사
4. **감사 로그**: 모든 배포 활동 기록

### 신뢰성

1. **멱등성**: 동일한 입력에 동일한 결과
2. **롤백 계획**: 항상 롤백 전략 준비
3. **스모크 테스트**: 배포 후 즉시 검증
4. **점진적 배포**: 한 번에 모든 트래픽 전환 금지

### 관찰 가능성

1. **메트릭 수집**: 파이프라인 성능 측정
2. **알림 설정**: 실패 시 즉시 통지
3. **로그 보관**: 디버깅을 위한 로그 유지
4. **대시보드**: 파이프라인 상태 시각화

---

## Rules

1. **버전 관리**: 모든 CI/CD 설정은 코드로 관리
2. **환경 분리**: 개발/스테이징/프로덕션 환경 명확히 분리
3. **수동 승인**: 프로덕션 배포는 수동 승인 필수
4. **테스트 필수**: 테스트 통과 없이 배포 금지
5. **문서화**: 파이프라인 변경 사항 문서화
