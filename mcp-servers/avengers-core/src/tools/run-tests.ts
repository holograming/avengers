/**
 * Run Tests Tool
 *
 * 실제 테스트를 실행하고 결과를 수집합니다.
 * validate-completion과 연동하여 실제 테스트 결과를 제공합니다.
 *
 * 지원 프레임워크:
 * - JavaScript/TypeScript: Jest, Vitest, Mocha
 * - Python: pytest, unittest
 * - C++: Google Test, Catch2
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { execSync, spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * Test type enumeration
 */
export type TestType = "unit" | "integration" | "e2e" | "all";

/**
 * Test framework detection result
 */
export interface DetectedFramework {
  name: string;
  type: "node" | "python" | "cpp";
  command: string;
  coverageCommand?: string;
}

/**
 * Individual test result
 */
export interface TestCaseResult {
  name: string;
  file: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
  stack?: string;
}

/**
 * Test suite results
 */
export interface TestSuiteResult {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: TestCaseResult[];
}

/**
 * Coverage information
 */
export interface CoverageResult {
  lines: number;
  branches: number;
  functions: number;
  statements: number;
}

/**
 * Complete test run result
 */
export interface RunTestsResult {
  success: boolean;
  framework: string;
  testResults: {
    unit: TestSuiteResult;
    integration: TestSuiteResult;
    e2e: TestSuiteResult;
  };
  coverage?: CoverageResult;
  totalDuration: number;
  output: string;
  command: string;
}

/**
 * Tool definition
 */
export const runTestsTool: Tool = {
  name: "avengers_run_tests",
  description: "실제 테스트를 실행하고 결과를 수집합니다. Jest, Vitest, pytest, Google Test 등 다양한 프레임워크를 지원하며 자동 감지합니다.",
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
      testType: {
        type: "string",
        enum: ["unit", "integration", "e2e", "all"],
        description: "실행할 테스트 유형 (기본: all)"
      },
      framework: {
        type: "string",
        enum: ["jest", "vitest", "pytest", "mocha", "gtest", "catch2", "auto-detect"],
        description: "테스트 프레임워크 (기본: auto-detect)"
      },
      coverage: {
        type: "boolean",
        description: "커버리지 측정 여부 (기본: true)"
      },
      timeout: {
        type: "number",
        description: "테스트 타임아웃 (ms, 기본: 300000)"
      },
      filter: {
        type: "string",
        description: "테스트 이름 필터 패턴"
      },
      env: {
        type: "object",
        description: "추가 환경 변수"
      }
    },
    required: ["taskId"]
  }
};

/**
 * Run tests parameters
 */
interface RunTestsParams {
  taskId: string;
  projectPath?: string;
  testType?: TestType;
  framework?: string;
  coverage?: boolean;
  timeout?: number;
  filter?: string;
  env?: Record<string, string>;
}

/**
 * Detect test framework from project structure
 */
function detectFramework(projectPath: string): DetectedFramework | null {
  // Check package.json for Node.js projects
  const packageJsonPath = path.join(projectPath, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      // Check for test frameworks
      if (deps.vitest) {
        return {
          name: "vitest",
          type: "node",
          command: "npx vitest run",
          coverageCommand: "npx vitest run --coverage"
        };
      }
      if (deps.jest) {
        return {
          name: "jest",
          type: "node",
          command: "npx jest",
          coverageCommand: "npx jest --coverage"
        };
      }
      if (deps.mocha) {
        return {
          name: "mocha",
          type: "node",
          command: "npx mocha",
          coverageCommand: "npx nyc mocha"
        };
      }

      // Check scripts
      if (packageJson.scripts?.test) {
        return {
          name: "npm-test",
          type: "node",
          command: "npm test",
          coverageCommand: "npm test -- --coverage"
        };
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  // Check for Python projects
  const pytestIni = path.join(projectPath, "pytest.ini");
  const pyprojectToml = path.join(projectPath, "pyproject.toml");
  const setupPy = path.join(projectPath, "setup.py");

  if (fs.existsSync(pytestIni) || fs.existsSync(pyprojectToml) || fs.existsSync(setupPy)) {
    return {
      name: "pytest",
      type: "python",
      command: "python -m pytest",
      coverageCommand: "python -m pytest --cov"
    };
  }

  // Check for C++ projects
  const cmakeLists = path.join(projectPath, "CMakeLists.txt");
  if (fs.existsSync(cmakeLists)) {
    const cmakeContent = fs.readFileSync(cmakeLists, "utf-8");

    if (cmakeContent.includes("gtest") || cmakeContent.includes("GTest")) {
      return {
        name: "gtest",
        type: "cpp",
        command: "ctest --output-on-failure",
        coverageCommand: "ctest --output-on-failure"
      };
    }
    if (cmakeContent.includes("Catch2") || cmakeContent.includes("catch2")) {
      return {
        name: "catch2",
        type: "cpp",
        command: "ctest --output-on-failure",
        coverageCommand: "ctest --output-on-failure"
      };
    }
  }

  return null;
}

/**
 * Parse Jest/Vitest output
 */
function parseNodeTestOutput(output: string, framework: string): TestSuiteResult {
  const result: TestSuiteResult = {
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    tests: []
  };

  // Parse test counts from output
  // Jest format: "Tests:       X passed, Y failed, Z total"
  // Vitest format: similar
  const testsMatch = output.match(/Tests:\s+(\d+)\s+passed[,\s]+(\d+)\s+failed/i);
  if (testsMatch) {
    result.passed = parseInt(testsMatch[1], 10);
    result.failed = parseInt(testsMatch[2], 10);
  }

  // Alternative parsing for Vitest
  const passedMatch = output.match(/(\d+)\s+pass/i);
  const failedMatch = output.match(/(\d+)\s+fail/i);
  const skippedMatch = output.match(/(\d+)\s+skip/i);

  if (passedMatch) result.passed = parseInt(passedMatch[1], 10);
  if (failedMatch) result.failed = parseInt(failedMatch[1], 10);
  if (skippedMatch) result.skipped = parseInt(skippedMatch[1], 10);

  // Parse duration
  const durationMatch = output.match(/Time:\s+(\d+(?:\.\d+)?)\s*s/i);
  if (durationMatch) {
    result.duration = parseFloat(durationMatch[1]) * 1000;
  }

  // Parse failed test details
  const failureBlocks = output.split(/FAIL\s+/);
  for (let i = 1; i < failureBlocks.length; i++) {
    const block = failureBlocks[i];
    const fileMatch = block.match(/^([^\s]+)/);
    const errorMatch = block.match(/Error:\s*(.+?)(?=\n\s+at|\n\n)/s);

    if (fileMatch) {
      result.tests.push({
        name: fileMatch[1],
        file: fileMatch[1],
        status: "failed",
        duration: 0,
        error: errorMatch ? errorMatch[1].trim() : "Test failed"
      });
    }
  }

  return result;
}

/**
 * Parse pytest output
 */
function parsePytestOutput(output: string): TestSuiteResult {
  const result: TestSuiteResult = {
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    tests: []
  };

  // Parse summary line: "X passed, Y failed, Z skipped in Ns"
  const summaryMatch = output.match(/(\d+)\s+passed.*?(\d+)\s+failed.*?in\s+(\d+(?:\.\d+)?)\s*s/i);
  if (summaryMatch) {
    result.passed = parseInt(summaryMatch[1], 10);
    result.failed = parseInt(summaryMatch[2], 10);
    result.duration = parseFloat(summaryMatch[3]) * 1000;
  }

  // Alternative parsing
  const passedMatch = output.match(/(\d+)\s+passed/i);
  const failedMatch = output.match(/(\d+)\s+failed/i);
  const skippedMatch = output.match(/(\d+)\s+skipped/i);

  if (passedMatch) result.passed = parseInt(passedMatch[1], 10);
  if (failedMatch) result.failed = parseInt(failedMatch[1], 10);
  if (skippedMatch) result.skipped = parseInt(skippedMatch[1], 10);

  // Parse failed test names
  const failedTests = output.match(/FAILED\s+([^\s]+)/g);
  if (failedTests) {
    for (const match of failedTests) {
      const testName = match.replace("FAILED ", "");
      result.tests.push({
        name: testName,
        file: testName.split("::")[0],
        status: "failed",
        duration: 0,
        error: "Test failed"
      });
    }
  }

  return result;
}

/**
 * Parse CTest output (for C++ projects)
 */
function parseCtestOutput(output: string): TestSuiteResult {
  const result: TestSuiteResult = {
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    tests: []
  };

  // Parse summary: "X tests passed, Y tests failed"
  const passedMatch = output.match(/(\d+)\s+tests?\s+passed/i);
  const failedMatch = output.match(/(\d+)\s+tests?\s+failed/i);

  if (passedMatch) result.passed = parseInt(passedMatch[1], 10);
  if (failedMatch) result.failed = parseInt(failedMatch[1], 10);

  // Parse total time
  const timeMatch = output.match(/Total Test time.*?=\s+(\d+(?:\.\d+)?)\s+sec/i);
  if (timeMatch) {
    result.duration = parseFloat(timeMatch[1]) * 1000;
  }

  // Parse individual test results
  const testLines = output.match(/\d+\/\d+ Test\s+#\d+:\s+(\S+)\s+\.+\s+(Passed|Failed)/g);
  if (testLines) {
    for (const line of testLines) {
      const match = line.match(/Test\s+#\d+:\s+(\S+)\s+\.+\s+(Passed|Failed)/);
      if (match) {
        result.tests.push({
          name: match[1],
          file: match[1],
          status: match[2].toLowerCase() as "passed" | "failed",
          duration: 0
        });
      }
    }
  }

  return result;
}

/**
 * Parse coverage from output
 */
function parseCoverage(output: string, framework: string): CoverageResult | undefined {
  // Jest/Vitest coverage table
  // All files     |   85.71 |    66.67 |     100 |   85.71 |
  const coverageMatch = output.match(/All files\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)/);

  if (coverageMatch) {
    return {
      statements: parseFloat(coverageMatch[1]),
      branches: parseFloat(coverageMatch[2]),
      functions: parseFloat(coverageMatch[3]),
      lines: parseFloat(coverageMatch[4])
    };
  }

  // Pytest coverage
  // TOTAL     100    10    90%
  const pytestCoverage = output.match(/TOTAL\s+\d+\s+\d+\s+(\d+)%/);
  if (pytestCoverage) {
    const pct = parseFloat(pytestCoverage[1]);
    return {
      statements: pct,
      branches: pct,
      functions: pct,
      lines: pct
    };
  }

  return undefined;
}

/**
 * Execute test command
 */
function executeTests(
  command: string,
  projectPath: string,
  timeout: number,
  env?: Record<string, string>
): { output: string; exitCode: number } {
  try {
    const output = execSync(command, {
      cwd: projectPath,
      timeout,
      encoding: "utf-8",
      env: { ...process.env, ...env },
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      stdio: ["pipe", "pipe", "pipe"]
    });
    return { output, exitCode: 0 };
  } catch (error: any) {
    // execSync throws on non-zero exit codes
    // But we still want the output
    return {
      output: error.stdout?.toString() || error.message,
      exitCode: error.status || 1
    };
  }
}

/**
 * Main handler
 */
export async function handleRunTests(args: Record<string, unknown>) {
  const params = args as unknown as RunTestsParams;
  const {
    taskId,
    projectPath = process.cwd(),
    testType = "all",
    framework: requestedFramework = "auto-detect",
    coverage = true,
    timeout = 300000,
    filter,
    env
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

  // Detect or use specified framework
  let framework: DetectedFramework | null = null;

  if (requestedFramework === "auto-detect") {
    framework = detectFramework(absolutePath);
    if (!framework) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "테스트 프레임워크를 자동으로 감지할 수 없습니다.",
            suggestion: "framework 파라미터를 명시적으로 지정하거나, 프로젝트에 테스트 설정을 추가해주세요.",
            checkedPaths: [
              path.join(absolutePath, "package.json"),
              path.join(absolutePath, "pytest.ini"),
              path.join(absolutePath, "CMakeLists.txt")
            ]
          }, null, 2)
        }],
        isError: true
      };
    }
  } else {
    // Manual framework specification
    const frameworkCommands: Record<string, DetectedFramework> = {
      jest: { name: "jest", type: "node", command: "npx jest", coverageCommand: "npx jest --coverage" },
      vitest: { name: "vitest", type: "node", command: "npx vitest run", coverageCommand: "npx vitest run --coverage" },
      mocha: { name: "mocha", type: "node", command: "npx mocha", coverageCommand: "npx nyc mocha" },
      pytest: { name: "pytest", type: "python", command: "python -m pytest", coverageCommand: "python -m pytest --cov" },
      gtest: { name: "gtest", type: "cpp", command: "ctest --output-on-failure" },
      catch2: { name: "catch2", type: "cpp", command: "ctest --output-on-failure" }
    };

    framework = frameworkCommands[requestedFramework] || null;
    if (!framework) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `지원하지 않는 프레임워크: ${requestedFramework}`,
            supportedFrameworks: Object.keys(frameworkCommands)
          }, null, 2)
        }],
        isError: true
      };
    }
  }

  // Build test command
  let command = coverage && framework.coverageCommand
    ? framework.coverageCommand
    : framework.command;

  // Add filter if specified
  if (filter) {
    switch (framework.name) {
      case "jest":
      case "vitest":
        command += ` --testNamePattern="${filter}"`;
        break;
      case "pytest":
        command += ` -k "${filter}"`;
        break;
      case "mocha":
        command += ` --grep "${filter}"`;
        break;
    }
  }

  // Add test type filter
  if (testType !== "all") {
    switch (framework.name) {
      case "jest":
      case "vitest":
        command += ` --testPathPattern="${testType}"`;
        break;
      case "pytest":
        command += ` tests/${testType}`;
        break;
    }
  }

  // Execute tests
  const startTime = Date.now();
  const { output, exitCode } = executeTests(command, absolutePath, timeout, env);
  const totalDuration = Date.now() - startTime;

  // Parse results based on framework type
  let unitResults: TestSuiteResult;
  let integrationResults: TestSuiteResult = { passed: 0, failed: 0, skipped: 0, duration: 0, tests: [] };
  let e2eResults: TestSuiteResult = { passed: 0, failed: 0, skipped: 0, duration: 0, tests: [] };

  switch (framework.type) {
    case "node":
      unitResults = parseNodeTestOutput(output, framework.name);
      break;
    case "python":
      unitResults = parsePytestOutput(output);
      break;
    case "cpp":
      unitResults = parseCtestOutput(output);
      break;
    default:
      unitResults = { passed: 0, failed: 0, skipped: 0, duration: 0, tests: [] };
  }

  // Parse coverage
  const coverageResult = coverage ? parseCoverage(output, framework.name) : undefined;

  // Determine success
  const success = exitCode === 0 && unitResults.failed === 0;

  // Build result
  const result: RunTestsResult = {
    success,
    framework: framework.name,
    testResults: {
      unit: unitResults,
      integration: integrationResults,
      e2e: e2eResults
    },
    coverage: coverageResult,
    totalDuration,
    output: output.slice(0, 5000), // Limit output size
    command
  };

  // Build message
  const message = buildResultMessage(result, taskId);

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        ...result,
        message,
        nextAction: success
          ? {
              action: "validate",
              message: "테스트 통과. 완료 검증을 진행하세요.",
              tool: "avengers_validate_completion",
              params: {
                taskId,
                testResults: {
                  unit: {
                    passed: unitResults.passed,
                    failed: unitResults.failed,
                    skipped: unitResults.skipped
                  },
                  integration: {
                    passed: integrationResults.passed,
                    failed: integrationResults.failed,
                    skipped: integrationResults.skipped
                  },
                  e2e: {
                    passed: e2eResults.passed,
                    failed: e2eResults.failed,
                    skipped: e2eResults.skipped
                  },
                  coverage: coverageResult?.lines || 0
                }
              }
            }
          : {
              action: "fix",
              message: "테스트 실패. 코드를 수정하세요.",
              failedTests: unitResults.tests.filter(t => t.status === "failed")
            }
      }, null, 2)
    }]
  };
}

/**
 * Build human-readable result message
 */
function buildResultMessage(result: RunTestsResult, taskId: string): string {
  const lines: string[] = [
    `## 테스트 실행 결과`,
    ``,
    `**태스크**: ${taskId}`,
    `**프레임워크**: ${result.framework}`,
    `**상태**: ${result.success ? "✅ 성공" : "❌ 실패"}`,
    `**실행 시간**: ${(result.totalDuration / 1000).toFixed(2)}s`,
    ``
  ];

  // Test summary
  const { unit, integration, e2e } = result.testResults;
  const totalPassed = unit.passed + integration.passed + e2e.passed;
  const totalFailed = unit.failed + integration.failed + e2e.failed;
  const totalSkipped = unit.skipped + integration.skipped + e2e.skipped;

  lines.push(`### 테스트 요약`);
  lines.push(`- 통과: ${totalPassed}`);
  lines.push(`- 실패: ${totalFailed}`);
  lines.push(`- 건너뜀: ${totalSkipped}`);
  lines.push(``);

  // Coverage
  if (result.coverage) {
    lines.push(`### 커버리지`);
    lines.push(`- 라인: ${result.coverage.lines.toFixed(1)}%`);
    lines.push(`- 브랜치: ${result.coverage.branches.toFixed(1)}%`);
    lines.push(`- 함수: ${result.coverage.functions.toFixed(1)}%`);
    lines.push(``);
  }

  // Failed tests
  const failedTests = unit.tests.filter(t => t.status === "failed");
  if (failedTests.length > 0) {
    lines.push(`### 실패한 테스트`);
    for (const test of failedTests.slice(0, 5)) {
      lines.push(`- **${test.name}**`);
      if (test.error) {
        lines.push(`  - ${test.error.slice(0, 200)}`);
      }
    }
    if (failedTests.length > 5) {
      lines.push(`- ... 외 ${failedTests.length - 5}개`);
    }
  }

  return lines.join("\n");
}
