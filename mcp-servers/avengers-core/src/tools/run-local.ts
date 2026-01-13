/**
 * Run Local Tool
 *
 * 로컬에서 애플리케이션을 실행하고 헬스체크를 수행합니다.
 * Phase 6.5에서 실제로 애플리케이션이 실행되는지 확인합니다.
 *
 * 기능:
 * - 프로젝트 자동 감지 및 실행
 * - 헬스체크 엔드포인트 검증
 * - 프로세스 관리 (시작/중지)
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { spawn, ChildProcess, execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as https from "https";

/**
 * Run mode enumeration
 */
export type RunMode = "start" | "dev" | "preview" | "serve" | "custom";

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  endpoint: string;
  expectedStatus?: number;
  expectedBody?: string;
  timeout?: number;
}

/**
 * Process information
 */
export interface ProcessInfo {
  pid: number;
  command: string;
  startTime: number;
  port?: number;
}

/**
 * Run result
 */
export interface RunLocalResult {
  success: boolean;
  pid?: number;
  url?: string;
  port?: number;
  startupTime: number;
  healthCheckPassed: boolean;
  healthCheckDetails?: {
    status: number;
    body: string;
  };
  logs: string[];
  error?: string;
  command: string;
}

// Global process tracker
const runningProcesses = new Map<string, ProcessInfo>();

/**
 * Tool definition
 */
export const runLocalTool: Tool = {
  name: "avengers_run_local",
  description: "로컬에서 애플리케이션을 실행하고 헬스체크를 수행합니다. 웹 서버, API 서버, 데스크톱 앱 등을 지원합니다.",
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
      mode: {
        type: "string",
        enum: ["start", "dev", "preview", "serve", "custom"],
        description: "실행 모드 (기본: start)"
      },
      customCommand: {
        type: "string",
        description: "사용자 지정 실행 명령어 (mode=custom일 때)"
      },
      port: {
        type: "number",
        description: "서버 포트 (기본: 자동 감지)"
      },
      timeout: {
        type: "number",
        description: "시작 타임아웃 (ms, 기본: 30000)"
      },
      healthCheck: {
        type: "object",
        description: "헬스체크 설정",
        properties: {
          endpoint: { type: "string" },
          expectedStatus: { type: "number" },
          expectedBody: { type: "string" },
          timeout: { type: "number" }
        }
      },
      env: {
        type: "object",
        description: "추가 환경 변수"
      },
      background: {
        type: "boolean",
        description: "백그라운드 실행 여부 (기본: true)"
      }
    },
    required: ["taskId"]
  }
};

/**
 * Run local parameters
 */
interface RunLocalParams {
  taskId: string;
  projectPath?: string;
  mode?: RunMode;
  customCommand?: string;
  port?: number;
  timeout?: number;
  healthCheck?: HealthCheckConfig;
  env?: Record<string, string>;
  background?: boolean;
}

/**
 * Detected run configuration
 */
interface DetectedRunConfig {
  command: string;
  defaultPort: number;
  type: "node" | "python" | "cpp" | "other";
}

/**
 * Detect run command from project structure
 */
function detectRunCommand(projectPath: string, mode: RunMode): DetectedRunConfig | null {
  // Check package.json for Node.js projects
  const packageJsonPath = path.join(projectPath, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const scripts = packageJson.scripts || {};

      // Detect package manager
      let pm = "npm run";
      if (fs.existsSync(path.join(projectPath, "bun.lockb"))) pm = "bun";
      else if (fs.existsSync(path.join(projectPath, "pnpm-lock.yaml"))) pm = "pnpm";
      else if (fs.existsSync(path.join(projectPath, "yarn.lock"))) pm = "yarn";

      // Select command based on mode
      let command: string | undefined;
      let defaultPort = 3000;

      switch (mode) {
        case "start":
          command = scripts.start ? `${pm} start` : undefined;
          break;
        case "dev":
          command = scripts.dev ? `${pm} dev` : scripts.start ? `${pm} start` : undefined;
          break;
        case "preview":
          command = scripts.preview ? `${pm} preview` : scripts.serve ? `${pm} serve` : undefined;
          defaultPort = 4173; // Vite preview default
          break;
        case "serve":
          command = scripts.serve ? `${pm} serve` : undefined;
          break;
      }

      // Try to detect port from scripts
      const startScript = scripts.start || scripts.dev || "";
      const portMatch = startScript.match(/--port[=\s]+(\d+)|-p\s+(\d+)/);
      if (portMatch) {
        defaultPort = parseInt(portMatch[1] || portMatch[2], 10);
      }

      if (command) {
        return { command, defaultPort, type: "node" };
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  // Check for Python projects
  const mainPy = path.join(projectPath, "main.py");
  const appPy = path.join(projectPath, "app.py");
  const managePy = path.join(projectPath, "manage.py");

  if (fs.existsSync(managePy)) {
    return {
      command: "python manage.py runserver",
      defaultPort: 8000,
      type: "python"
    };
  }

  if (fs.existsSync(appPy)) {
    // Check if it's Flask
    const content = fs.readFileSync(appPy, "utf-8");
    if (content.includes("flask") || content.includes("Flask")) {
      return {
        command: "flask run",
        defaultPort: 5000,
        type: "python"
      };
    }
    // Check if it's FastAPI
    if (content.includes("fastapi") || content.includes("FastAPI")) {
      return {
        command: "uvicorn app:app --reload",
        defaultPort: 8000,
        type: "python"
      };
    }
  }

  if (fs.existsSync(mainPy)) {
    return {
      command: "python main.py",
      defaultPort: 8000,
      type: "python"
    };
  }

  // Check for C++ projects with built executable
  const buildDir = path.join(projectPath, "build");
  if (fs.existsSync(buildDir)) {
    // Look for executable
    const files = fs.readdirSync(buildDir);
    for (const file of files) {
      const fullPath = path.join(buildDir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile() && (stat.mode & fs.constants.X_OK)) {
          return {
            command: fullPath,
            defaultPort: 0, // No port for desktop apps
            type: "cpp"
          };
        }
      } catch {
        // Ignore permission errors
      }
    }
  }

  return null;
}

/**
 * Start process and capture output
 */
function startProcess(
  command: string,
  cwd: string,
  env?: Record<string, string>
): { process: ChildProcess; logs: string[] } {
  const logs: string[] = [];

  // Split command into parts
  const parts = command.split(" ");
  const cmd = parts[0];
  const args = parts.slice(1);

  const childProcess = spawn(cmd, args, {
    cwd,
    env: { ...process.env, ...env },
    shell: true,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"]
  });

  // Capture output
  childProcess.stdout?.on("data", (data) => {
    logs.push(data.toString());
  });

  childProcess.stderr?.on("data", (data) => {
    logs.push(data.toString());
  });

  return { process: childProcess, logs };
}

/**
 * Wait for server to be ready
 */
async function waitForServer(
  port: number,
  timeout: number,
  host = "localhost"
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.request({
          hostname: host,
          port,
          path: "/",
          method: "GET",
          timeout: 1000
        }, (res) => {
          resolve();
        });

        req.on("error", reject);
        req.end();
      });
      return true;
    } catch {
      // Wait and retry
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return false;
}

/**
 * Perform health check
 */
async function performHealthCheck(
  url: string,
  config: HealthCheckConfig
): Promise<{ passed: boolean; status?: number; body?: string; error?: string }> {
  const { expectedStatus = 200, expectedBody, timeout = 5000 } = config;

  return new Promise((resolve) => {
    const protocol = url.startsWith("https") ? https : http;

    const req = protocol.get(url, { timeout }, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        const statusPassed = res.statusCode === expectedStatus;
        const bodyPassed = !expectedBody || body.includes(expectedBody);

        resolve({
          passed: statusPassed && bodyPassed,
          status: res.statusCode,
          body: body.slice(0, 500)
        });
      });
    });

    req.on("error", (error) => {
      resolve({
        passed: false,
        error: error.message
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        passed: false,
        error: "Health check timeout"
      });
    });
  });
}

/**
 * Find available port
 */
async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 100; port++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const server = http.createServer();
        server.listen(port, () => {
          server.close();
          resolve();
        });
        server.on("error", reject);
      });
      return port;
    } catch {
      // Port in use, try next
    }
  }
  return startPort;
}

/**
 * Main handler
 */
export async function handleRunLocal(args: Record<string, unknown>) {
  const params = args as unknown as RunLocalParams;
  const {
    taskId,
    projectPath = process.cwd(),
    mode = "start",
    customCommand,
    port: requestedPort,
    timeout = 30000,
    healthCheck,
    env,
    background = true
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

  // Determine command
  let command: string;
  let defaultPort: number;
  let projectType: string;

  if (mode === "custom" && customCommand) {
    command = customCommand;
    defaultPort = requestedPort || 3000;
    projectType = "custom";
  } else {
    const runConfig = detectRunCommand(absolutePath, mode);
    if (!runConfig) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "실행 명령어를 감지할 수 없습니다.",
            suggestion: "mode='custom'과 customCommand를 사용하거나, package.json에 start/dev 스크립트를 추가해주세요.",
            availableModes: ["start", "dev", "preview", "serve", "custom"]
          }, null, 2)
        }],
        isError: true
      };
    }
    command = runConfig.command;
    defaultPort = runConfig.defaultPort;
    projectType = runConfig.type;
  }

  // Determine port
  const port = requestedPort || defaultPort;

  // Check if already running
  if (runningProcesses.has(taskId)) {
    const existing = runningProcesses.get(taskId)!;
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: `태스크 ${taskId}에 대한 프로세스가 이미 실행 중입니다.`,
          existingProcess: existing,
          suggestion: "avengers_stop_process를 사용하여 기존 프로세스를 종료해주세요."
        }, null, 2)
      }],
      isError: true
    };
  }

  const startTime = Date.now();

  // Start process
  const { process: childProcess, logs } = startProcess(command, absolutePath, env);

  if (!childProcess.pid) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: "프로세스 시작 실패",
          command,
          logs
        }, null, 2)
      }],
      isError: true
    };
  }

  // Store process info
  runningProcesses.set(taskId, {
    pid: childProcess.pid,
    command,
    startTime,
    port
  });

  // Wait for server to be ready (if web project)
  let serverReady = false;
  if (port > 0) {
    serverReady = await waitForServer(port, timeout);
  } else {
    // For non-server apps, just wait a bit
    await new Promise((resolve) => setTimeout(resolve, 2000));
    serverReady = true;
  }

  const startupTime = Date.now() - startTime;

  // Perform health check if configured
  let healthCheckPassed = true;
  let healthCheckDetails: { status: number; body: string } | undefined;

  if (healthCheck && serverReady && port > 0) {
    const endpoint = healthCheck.endpoint.startsWith("/")
      ? healthCheck.endpoint
      : `/${healthCheck.endpoint}`;

    const checkUrl = `http://localhost:${port}${endpoint}`;
    const checkResult = await performHealthCheck(checkUrl, healthCheck);

    healthCheckPassed = checkResult.passed;
    if (checkResult.status !== undefined) {
      healthCheckDetails = {
        status: checkResult.status,
        body: checkResult.body || ""
      };
    }
  }

  const url = port > 0 ? `http://localhost:${port}` : undefined;
  const success = serverReady && healthCheckPassed;

  // Build result
  const result: RunLocalResult = {
    success,
    pid: childProcess.pid,
    url,
    port: port > 0 ? port : undefined,
    startupTime,
    healthCheckPassed,
    healthCheckDetails,
    logs: logs.slice(-20),
    command
  };

  // Clean up if not running in background
  if (!background || !success) {
    try {
      process.kill(-childProcess.pid, "SIGTERM");
    } catch {
      // Process may have already exited
    }
    runningProcesses.delete(taskId);
  }

  // Build message
  const message = buildResultMessage(result, taskId, projectType);

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        ...result,
        message,
        nextAction: success
          ? {
              action: "verify",
              message: "애플리케이션이 정상 실행됩니다.",
              url,
              suggestion: "검증이 완료되면 avengers_stop_process로 프로세스를 종료하세요."
            }
          : {
              action: "fix",
              message: "실행 실패. 로그를 확인하세요.",
              logs: result.logs
            }
      }, null, 2)
    }]
  };
}

/**
 * Get running processes map (for stop-process tool)
 */
export function getRunningProcesses(): Map<string, ProcessInfo> {
  return runningProcesses;
}

/**
 * Build human-readable result message
 */
function buildResultMessage(result: RunLocalResult, taskId: string, projectType: string): string {
  const lines: string[] = [
    `## 로컬 실행 결과`,
    ``,
    `**태스크**: ${taskId}`,
    `**프로젝트 유형**: ${projectType}`,
    `**상태**: ${result.success ? "✅ 실행 중" : "❌ 실행 실패"}`,
    `**시작 시간**: ${(result.startupTime / 1000).toFixed(2)}s`,
    ``
  ];

  if (result.pid) {
    lines.push(`### 프로세스 정보`);
    lines.push(`- PID: ${result.pid}`);
    lines.push(`- 명령어: ${result.command}`);
    if (result.url) {
      lines.push(`- URL: ${result.url}`);
    }
    lines.push(``);
  }

  if (result.healthCheckDetails) {
    lines.push(`### 헬스체크 결과`);
    lines.push(`- 상태: ${result.healthCheckPassed ? "✅ 통과" : "❌ 실패"}`);
    lines.push(`- HTTP 상태 코드: ${result.healthCheckDetails.status}`);
    lines.push(``);
  }

  if (result.logs.length > 0) {
    lines.push(`### 최근 로그`);
    for (const log of result.logs.slice(-5)) {
      lines.push(`\`\`\``);
      lines.push(log.trim().slice(0, 200));
      lines.push(`\`\`\``);
    }
  }

  return lines.join("\n");
}
