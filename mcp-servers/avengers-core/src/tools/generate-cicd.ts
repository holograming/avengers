/**
 * Generate CI/CD Tool
 *
 * CI/CD 파이프라인 설정 파일을 생성합니다.
 * Phase 8에서 배포 파이프라인을 자동으로 구성합니다.
 *
 * 지원 플랫폼:
 * - GitHub Actions
 * - GitLab CI
 *
 * 지원 프로젝트 유형:
 * - Frontend (React, Vue, Next.js 등)
 * - Backend (Node.js, Python, Go 등)
 * - Fullstack
 * - C++ (CMake)
 * - Python
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

/**
 * CI/CD Platform
 */
export type CICDPlatform = "github-actions" | "gitlab-ci" | "both";

/**
 * Project type
 */
export type ProjectType = "frontend" | "backend" | "fullstack" | "cpp" | "python" | "auto-detect";

/**
 * Deployment target
 */
export type DeployTarget = "vercel" | "netlify" | "aws" | "docker" | "kubernetes" | "pypi" | "custom";

/**
 * Deployment strategy
 */
export type DeployStrategy = "rolling" | "blue-green" | "canary";

/**
 * Feature flags
 */
export interface CICDFeatures {
  lint?: boolean;
  test?: boolean;
  build?: boolean;
  deploy?: boolean;
  security?: boolean;
  matrix?: boolean;
}

/**
 * Deployment configuration
 */
export interface DeploymentConfig {
  target: DeployTarget;
  environments: ("staging" | "production")[];
  strategy?: DeployStrategy;
}

/**
 * Generated file
 */
export interface GeneratedFile {
  path: string;
  content: string;
  purpose: string;
}

/**
 * Generation result
 */
export interface GenerateCICDResult {
  success: boolean;
  projectType: ProjectType;
  platform: CICDPlatform;
  files: GeneratedFile[];
  summary: {
    jobs: string[];
    triggers: string[];
    secrets: string[];
    estimatedDuration: string;
  };
  nextSteps: string[];
}

/**
 * Tool definition
 */
export const generateCicdTool: Tool = {
  name: "avengers_generate_cicd",
  description: "CI/CD 파이프라인 설정 파일을 생성합니다. GitHub Actions, GitLab CI를 지원하며 프로젝트 유형에 따라 최적화된 설정을 생성합니다.",
  inputSchema: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "관련 태스크 ID"
      },
      projectPath: {
        type: "string",
        description: "프로젝트 루트 경로 (기본: 현재 디렉토리)"
      },
      platform: {
        type: "string",
        enum: ["github-actions", "gitlab-ci", "both"],
        description: "CI/CD 플랫폼 (기본: github-actions)"
      },
      projectType: {
        type: "string",
        enum: ["frontend", "backend", "fullstack", "cpp", "python", "auto-detect"],
        description: "프로젝트 유형 (기본: auto-detect)"
      },
      features: {
        type: "object",
        description: "활성화할 기능",
        properties: {
          lint: { type: "boolean" },
          test: { type: "boolean" },
          build: { type: "boolean" },
          deploy: { type: "boolean" },
          security: { type: "boolean" },
          matrix: { type: "boolean" }
        }
      },
      deployment: {
        type: "object",
        description: "배포 설정",
        properties: {
          target: {
            type: "string",
            enum: ["vercel", "netlify", "aws", "docker", "kubernetes", "pypi", "custom"]
          },
          environments: {
            type: "array",
            items: { type: "string", enum: ["staging", "production"] }
          },
          strategy: {
            type: "string",
            enum: ["rolling", "blue-green", "canary"]
          }
        }
      },
      template: {
        type: "string",
        enum: ["minimal", "standard", "comprehensive"],
        description: "템플릿 복잡도 (기본: standard)"
      }
    },
    required: ["taskId"]
  }
};

/**
 * Generate CI/CD parameters
 */
interface GenerateCICDParams {
  taskId: string;
  projectPath?: string;
  platform?: CICDPlatform;
  projectType?: ProjectType;
  features?: CICDFeatures;
  deployment?: DeploymentConfig;
  template?: "minimal" | "standard" | "comprehensive";
}

/**
 * Detect project type from structure
 */
function detectProjectType(projectPath: string): ProjectType {
  const packageJsonPath = path.join(projectPath, "package.json");
  const cmakeListsPath = path.join(projectPath, "CMakeLists.txt");
  const pyprojectPath = path.join(projectPath, "pyproject.toml");
  const requirementsPath = path.join(projectPath, "requirements.txt");

  // Check for C++ project
  if (fs.existsSync(cmakeListsPath)) {
    return "cpp";
  }

  // Check for Python project
  if (fs.existsSync(pyprojectPath) || fs.existsSync(requirementsPath)) {
    return "python";
  }

  // Check for Node.js project
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Check for frontend frameworks
      const frontendFrameworks = ["react", "vue", "svelte", "next", "nuxt", "@angular/core"];
      const hasFrontend = frontendFrameworks.some(fw => deps[fw]);

      // Check for backend frameworks
      const backendFrameworks = ["express", "fastify", "koa", "hapi", "nest", "@nestjs/core"];
      const hasBackend = backendFrameworks.some(fw => deps[fw]);

      if (hasFrontend && hasBackend) return "fullstack";
      if (hasFrontend) return "frontend";
      if (hasBackend) return "backend";

      // Default to backend for Node.js projects
      return "backend";
    } catch {
      return "backend";
    }
  }

  return "backend";
}

/**
 * Detect package manager
 */
function detectPackageManager(projectPath: string): "npm" | "yarn" | "pnpm" | "bun" {
  if (fs.existsSync(path.join(projectPath, "bun.lockb"))) return "bun";
  if (fs.existsSync(path.join(projectPath, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(projectPath, "yarn.lock"))) return "yarn";
  return "npm";
}

/**
 * Generate GitHub Actions workflow for Node.js projects
 */
function generateGitHubActionsNode(
  projectType: ProjectType,
  features: CICDFeatures,
  deployment: DeploymentConfig | undefined,
  pm: string
): string {
  const installCmd = pm === "npm" ? "npm ci" : `${pm} install --frozen-lockfile`;
  const runCmd = pm === "npm" ? "npm run" : pm;

  let workflow = `name: CI/CD Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

env:
  NODE_VERSION: '20'

jobs:`;

  // Lint job
  if (features.lint) {
    workflow += `
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: '${pm}'
      - run: ${installCmd}
      - run: ${runCmd} lint
`;
  }

  // Test job
  if (features.test) {
    workflow += `
  test:
    runs-on: ubuntu-latest
    ${features.lint ? "needs: lint" : ""}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: '${pm}'
      - run: ${installCmd}
      - run: ${runCmd} test -- --coverage
      - uses: codecov/codecov-action@v4
        if: always()
`;
  }

  // Build job
  if (features.build) {
    workflow += `
  build:
    runs-on: ubuntu-latest
    ${features.test ? "needs: test" : features.lint ? "needs: lint" : ""}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: '${pm}'
      - run: ${installCmd}
      - run: ${runCmd} build
      - uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: dist/
          retention-days: 7
`;
  }

  // Security scan
  if (features.security) {
    workflow += `
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
        continue-on-error: true
`;
  }

  // Deploy job
  if (features.deploy && deployment) {
    switch (deployment.target) {
      case "vercel":
        workflow += `
  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
`;
        break;

      case "docker":
        workflow += `
  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/\${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
`;
        break;

      case "aws":
        workflow += `
  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: build-artifacts
          path: dist/
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: \${{ secrets.AWS_REGION }}
      - run: aws s3 sync dist/ s3://\${{ secrets.S3_BUCKET }}/
`;
        break;
    }
  }

  return workflow;
}

/**
 * Generate GitHub Actions workflow for Python projects
 */
function generateGitHubActionsPython(
  features: CICDFeatures,
  deployment: DeploymentConfig | undefined
): string {
  let workflow = `name: Python CI/CD

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

env:
  PYTHON_VERSION: '3.11'

jobs:`;

  // Lint job
  if (features.lint) {
    workflow += `
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: \${{ env.PYTHON_VERSION }}
      - run: pip install ruff black mypy
      - run: ruff check .
      - run: black --check .
      - run: mypy .
`;
  }

  // Test job
  if (features.test) {
    workflow += `
  test:
    runs-on: ubuntu-latest
    ${features.lint ? "needs: lint" : ""}
    ${features.matrix ? `
    strategy:
      matrix:
        python-version: ['3.10', '3.11', '3.12']` : ""}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${features.matrix ? "${{ matrix.python-version }}" : "${{ env.PYTHON_VERSION }}"}
      - run: pip install -e ".[dev]" || pip install -r requirements.txt pytest pytest-cov
      - run: pytest --cov --cov-report=xml
      - uses: codecov/codecov-action@v4
        if: always()
`;
  }

  // Build job
  if (features.build) {
    workflow += `
  build:
    runs-on: ubuntu-latest
    ${features.test ? "needs: test" : features.lint ? "needs: lint" : ""}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: \${{ env.PYTHON_VERSION }}
      - run: pip install build
      - run: python -m build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
`;
  }

  // Deploy to PyPI
  if (features.deploy && deployment?.target === "pypi") {
    workflow += `
  publish:
    runs-on: ubuntu-latest
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - uses: pypa/gh-action-pypi-publish@release/v1
        with:
          password: \${{ secrets.PYPI_API_TOKEN }}
`;
  }

  return workflow;
}

/**
 * Generate GitHub Actions workflow for C++ projects
 */
function generateGitHubActionsCpp(
  features: CICDFeatures
): string {
  let workflow = `name: C++ CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:`;

  workflow += `
  build:
    runs-on: \${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        build_type: [Release]
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install dependencies (Ubuntu)
        if: runner.os == 'Linux'
        run: |
          sudo apt-get update
          sudo apt-get install -y cmake ninja-build

      - name: Install dependencies (macOS)
        if: runner.os == 'macOS'
        run: brew install cmake ninja

      - name: Configure CMake
        run: cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=\${{ matrix.build_type }}

      - name: Build
        run: cmake --build build --config \${{ matrix.build_type }}
`;

  if (features.test) {
    workflow += `
      - name: Test
        working-directory: build
        run: ctest --output-on-failure -C \${{ matrix.build_type }}
`;
  }

  return workflow;
}

/**
 * Generate GitLab CI configuration
 */
function generateGitLabCI(
  projectType: ProjectType,
  features: CICDFeatures,
  deployment: DeploymentConfig | undefined
): string {
  let config = `stages:
  - lint
  - test
  - build
  - deploy

default:
  image: node:20-alpine
  cache:
    key: \${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
`;

  if (features.lint) {
    config += `
lint:
  stage: lint
  script:
    - npm ci
    - npm run lint
`;
  }

  if (features.test) {
    config += `
test:
  stage: test
  script:
    - npm ci
    - npm run test -- --coverage
  coverage: '/All files[^|]*\\|[^|]*\\s+([\\d\\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
`;
  }

  if (features.build) {
    config += `
build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
`;
  }

  if (features.deploy && deployment) {
    config += `
deploy:
  stage: deploy
  script:
    - echo "Deploying to ${deployment.target}..."
  environment:
    name: production
  only:
    - main
`;
  }

  return config;
}

/**
 * Main handler
 */
export async function handleGenerateCicd(args: Record<string, unknown>) {
  const params = args as unknown as GenerateCICDParams;
  const {
    taskId,
    projectPath = process.cwd(),
    platform = "github-actions",
    projectType: requestedType = "auto-detect",
    features = { lint: true, test: true, build: true, deploy: false },
    deployment,
    template = "standard"
  } = params;

  // Resolve absolute path
  const absolutePath = path.isAbsolute(projectPath)
    ? projectPath
    : path.resolve(process.cwd(), projectPath);

  // Check if path exists
  if (!fs.existsSync(absolutePath)) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: `프로젝트 경로를 찾을 수 없습니다: ${absolutePath}`,
          suggestion: "올바른 프로젝트 경로를 지정해주세요."
        }, null, 2)
      }],
      isError: true
    };
  }

  // Detect or use specified project type
  const projectType = requestedType === "auto-detect"
    ? detectProjectType(absolutePath)
    : requestedType;

  const pm = detectPackageManager(absolutePath);
  const files: GeneratedFile[] = [];
  const jobs: string[] = [];
  const triggers: string[] = ["push to main/master", "pull requests"];
  const secrets: string[] = [];

  // Generate GitHub Actions workflow
  if (platform === "github-actions" || platform === "both") {
    let workflowContent: string;

    switch (projectType) {
      case "cpp":
        workflowContent = generateGitHubActionsCpp(features);
        break;
      case "python":
        workflowContent = generateGitHubActionsPython(features, deployment);
        if (features.deploy && deployment?.target === "pypi") {
          secrets.push("PYPI_API_TOKEN");
        }
        break;
      default:
        workflowContent = generateGitHubActionsNode(projectType, features, deployment, pm);
        if (features.deploy) {
          switch (deployment?.target) {
            case "vercel":
              secrets.push("VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID");
              break;
            case "aws":
              secrets.push("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "S3_BUCKET");
              break;
          }
        }
        if (features.security) {
          secrets.push("SNYK_TOKEN");
        }
    }

    files.push({
      path: ".github/workflows/ci.yml",
      content: workflowContent,
      purpose: "GitHub Actions CI/CD 워크플로우"
    });

    // Collect jobs
    if (features.lint) jobs.push("lint");
    if (features.test) jobs.push("test");
    if (features.build) jobs.push("build");
    if (features.security) jobs.push("security");
    if (features.deploy) jobs.push("deploy");
  }

  // Generate GitLab CI configuration
  if (platform === "gitlab-ci" || platform === "both") {
    const gitlabContent = generateGitLabCI(projectType, features, deployment);

    files.push({
      path: ".gitlab-ci.yml",
      content: gitlabContent,
      purpose: "GitLab CI/CD 설정"
    });
  }

  // Generate Dockerfile if Docker deployment
  if (deployment?.target === "docker") {
    let dockerContent: string;

    switch (projectType) {
      case "python":
        dockerContent = `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`;
        break;

      case "cpp":
        dockerContent = `FROM ubuntu:22.04 AS builder

RUN apt-get update && apt-get install -y cmake ninja-build g++

WORKDIR /app
COPY . .

RUN cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
RUN cmake --build build

FROM ubuntu:22.04
COPY --from=builder /app/build/app /usr/local/bin/
CMD ["app"]
`;
        break;

      default:
        dockerContent = `FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
`;
    }

    files.push({
      path: "Dockerfile",
      content: dockerContent,
      purpose: "Docker 컨테이너 빌드 설정"
    });

    // Add docker-compose for local development
    const composeContent = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
`;

    files.push({
      path: "docker-compose.yml",
      content: composeContent,
      purpose: "Docker Compose 로컬 개발 설정"
    });
  }

  // Estimate duration
  let estimatedDuration = "2-5 minutes";
  if (features.test) estimatedDuration = "5-10 minutes";
  if (projectType === "cpp" && features.matrix) estimatedDuration = "10-20 minutes";

  // Build result
  const result: GenerateCICDResult = {
    success: true,
    projectType,
    platform,
    files,
    summary: {
      jobs,
      triggers,
      secrets,
      estimatedDuration
    },
    nextSteps: buildNextSteps(files, secrets, deployment)
  };

  // Build message
  const message = buildResultMessage(result, taskId);

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        ...result,
        message,
        filesPreview: files.map(f => ({
          path: f.path,
          purpose: f.purpose,
          lines: f.content.split("\n").length
        }))
      }, null, 2)
    }]
  };
}

/**
 * Build next steps based on configuration
 */
function buildNextSteps(
  files: GeneratedFile[],
  secrets: string[],
  deployment: DeploymentConfig | undefined
): string[] {
  const steps: string[] = [];

  steps.push("생성된 파일들을 프로젝트에 저장하세요.");

  if (secrets.length > 0) {
    steps.push(`GitHub Secrets에 다음 값들을 설정하세요: ${secrets.join(", ")}`);
  }

  steps.push("git add . && git commit -m 'Add CI/CD configuration'");
  steps.push("git push origin main");

  if (deployment?.target === "docker") {
    steps.push("로컬에서 docker-compose up으로 테스트하세요.");
  }

  steps.push("GitHub Actions 탭에서 워크플로우 실행을 확인하세요.");

  return steps;
}

/**
 * Build human-readable result message
 */
function buildResultMessage(result: GenerateCICDResult, taskId: string): string {
  const lines: string[] = [
    `## CI/CD 설정 생성 완료`,
    ``,
    `**태스크**: ${taskId}`,
    `**프로젝트 유형**: ${result.projectType}`,
    `**플랫폼**: ${result.platform}`,
    ``
  ];

  lines.push(`### 생성된 파일`);
  for (const file of result.files) {
    lines.push(`- \`${file.path}\` - ${file.purpose}`);
  }
  lines.push(``);

  lines.push(`### 파이프라인 구성`);
  lines.push(`- Jobs: ${result.summary.jobs.join(" → ")}`);
  lines.push(`- Triggers: ${result.summary.triggers.join(", ")}`);
  lines.push(`- 예상 실행 시간: ${result.summary.estimatedDuration}`);
  lines.push(``);

  if (result.summary.secrets.length > 0) {
    lines.push(`### 필요한 Secrets`);
    for (const secret of result.summary.secrets) {
      lines.push(`- \`${secret}\``);
    }
    lines.push(``);
  }

  lines.push(`### 다음 단계`);
  for (let i = 0; i < result.nextSteps.length; i++) {
    lines.push(`${i + 1}. ${result.nextSteps[i]}`);
  }

  return lines.join("\n");
}
