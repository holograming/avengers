/**
 * Build Project Tool
 *
 * 프로젝트를 빌드하고 결과를 검증합니다.
 * Phase 6.5에서 실제 빌드가 성공하는지 확인합니다.
 *
 * 지원 빌드 시스템:
 * - Node.js: npm, yarn, pnpm, bun
 * - Python: pip, poetry, setuptools
 * - C++: CMake, Make
 * - Rust: Cargo
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * Build type enumeration
 */
export type BuildType = "development" | "production" | "test";

/**
 * Target platform
 */
export type TargetPlatform = "web" | "node" | "desktop" | "mobile" | "auto-detect";

/**
 * Detected build system
 */
export interface DetectedBuildSystem {
  name: string;
  type: "node" | "python" | "cpp" | "rust" | "other";
  buildCommand: string;
  devCommand?: string;
  prodCommand?: string;
  installCommand?: string;
}

/**
 * Build artifact information
 */
export interface BuildArtifact {
  name: string;
  path: string;
  size: number;
  type: "js" | "css" | "html" | "binary" | "wasm" | "other";
}

/**
 * Build result
 */
export interface BuildResult {
  success: boolean;
  buildSystem: string;
  buildType: BuildType;
  buildTime: number;
  outputPath: string;
  artifacts: BuildArtifact[];
  totalSize: number;
  warnings: string[];
  errors: string[];
  command: string;
}

/**
 * Tool definition
 */
export const buildProjectTool: Tool = {
  name: "avengers_build_project",
  description: "프로젝트를 빌드하고 결과를 검증합니다. npm, CMake, Cargo 등 다양한 빌드 시스템을 지원합니다.",
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
      buildType: {
        type: "string",
        enum: ["development", "production", "test"],
        description: "빌드 유형 (기본: production)"
      },
      target: {
        type: "string",
        enum: ["web", "node", "desktop", "mobile", "auto-detect"],
        description: "타겟 플랫폼 (기본: auto-detect)"
      },
      outputPath: {
        type: "string",
        description: "빌드 출력 경로 (기본: 자동 감지)"
      },
      installDeps: {
        type: "boolean",
        description: "의존성 설치 여부 (기본: true)"
      },
      env: {
        type: "object",
        description: "추가 환경 변수"
      },
      timeout: {
        type: "number",
        description: "빌드 타임아웃 (ms, 기본: 600000)"
      }
    },
    required: ["taskId"]
  }
};

/**
 * Build project parameters
 */
interface BuildProjectParams {
  taskId: string;
  projectPath?: string;
  buildType?: BuildType;
  target?: TargetPlatform;
  outputPath?: string;
  installDeps?: boolean;
  env?: Record<string, string>;
  timeout?: number;
}

/**
 * Detect build system from project structure
 */
function detectBuildSystem(projectPath: string): DetectedBuildSystem | null {
  // Check package.json for Node.js projects
  const packageJsonPath = path.join(projectPath, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const scripts = packageJson.scripts || {};

      // Detect package manager
      let pm = "npm";
      if (fs.existsSync(path.join(projectPath, "bun.lockb"))) pm = "bun";
      else if (fs.existsSync(path.join(projectPath, "pnpm-lock.yaml"))) pm = "pnpm";
      else if (fs.existsSync(path.join(projectPath, "yarn.lock"))) pm = "yarn";

      const runCmd = pm === "npm" ? "npm run" : `${pm}`;

      return {
        name: pm,
        type: "node",
        buildCommand: scripts.build ? `${runCmd} build` : `${pm} run tsc`,
        devCommand: scripts.dev ? `${runCmd} dev` : undefined,
        prodCommand: scripts.build ? `${runCmd} build` : undefined,
        installCommand: `${pm} install`
      };
    } catch {
      // Ignore JSON parse errors
    }
  }

  // Check for Python projects
  const pyprojectToml = path.join(projectPath, "pyproject.toml");
  const setupPy = path.join(projectPath, "setup.py");
  const requirementsTxt = path.join(projectPath, "requirements.txt");

  if (fs.existsSync(pyprojectToml)) {
    const content = fs.readFileSync(pyprojectToml, "utf-8");
    if (content.includes("[tool.poetry]")) {
      return {
        name: "poetry",
        type: "python",
        buildCommand: "poetry build",
        installCommand: "poetry install"
      };
    }
    return {
      name: "pip",
      type: "python",
      buildCommand: "python -m build",
      installCommand: "pip install -e ."
    };
  }

  if (fs.existsSync(setupPy)) {
    return {
      name: "setuptools",
      type: "python",
      buildCommand: "python setup.py build",
      installCommand: "pip install -e ."
    };
  }

  if (fs.existsSync(requirementsTxt)) {
    return {
      name: "pip",
      type: "python",
      buildCommand: "echo 'No build step'",
      installCommand: "pip install -r requirements.txt"
    };
  }

  // Check for C++ projects
  const cmakeLists = path.join(projectPath, "CMakeLists.txt");
  if (fs.existsSync(cmakeLists)) {
    return {
      name: "cmake",
      type: "cpp",
      buildCommand: "cmake --build build --config Release",
      devCommand: "cmake --build build --config Debug",
      installCommand: "cmake -B build -S ."
    };
  }

  // Check for Makefile
  const makefile = path.join(projectPath, "Makefile");
  if (fs.existsSync(makefile)) {
    return {
      name: "make",
      type: "cpp",
      buildCommand: "make",
      installCommand: "make deps"
    };
  }

  // Check for Rust projects
  const cargoToml = path.join(projectPath, "Cargo.toml");
  if (fs.existsSync(cargoToml)) {
    return {
      name: "cargo",
      type: "rust",
      buildCommand: "cargo build --release",
      devCommand: "cargo build",
      installCommand: "cargo fetch"
    };
  }

  return null;
}

/**
 * Get output directory based on build system
 */
function getOutputDirectory(projectPath: string, buildSystem: DetectedBuildSystem): string {
  switch (buildSystem.type) {
    case "node":
      // Check for common output directories
      for (const dir of ["dist", "build", "out", ".next", ".output"]) {
        const fullPath = path.join(projectPath, dir);
        if (fs.existsSync(fullPath)) return fullPath;
      }
      return path.join(projectPath, "dist");

    case "python":
      return path.join(projectPath, "dist");

    case "cpp":
      return path.join(projectPath, "build");

    case "rust":
      return path.join(projectPath, "target", "release");

    default:
      return path.join(projectPath, "build");
  }
}

/**
 * Collect build artifacts
 */
function collectArtifacts(outputPath: string): BuildArtifact[] {
  const artifacts: BuildArtifact[] = [];

  if (!fs.existsSync(outputPath)) return artifacts;

  function walkDir(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!file.startsWith(".") && file !== "node_modules") {
          walkDir(fullPath);
        }
      } else {
        const ext = path.extname(file).toLowerCase();
        let type: BuildArtifact["type"] = "other";

        if ([".js", ".mjs", ".cjs"].includes(ext)) type = "js";
        else if (ext === ".css") type = "css";
        else if (ext === ".html") type = "html";
        else if ([".exe", ".dll", ".so", ".dylib", ""].includes(ext)) type = "binary";
        else if (ext === ".wasm") type = "wasm";

        artifacts.push({
          name: file,
          path: fullPath,
          size: stat.size,
          type
        });
      }
    }
  }

  walkDir(outputPath);
  return artifacts;
}

/**
 * Execute command and capture output
 */
function executeCommand(
  command: string,
  cwd: string,
  timeout: number,
  env?: Record<string, string>
): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(command, {
      cwd,
      timeout,
      encoding: "utf-8",
      env: { ...process.env, ...env },
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"]
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || "",
      stderr: error.stderr?.toString() || error.message,
      exitCode: error.status || 1
    };
  }
}

/**
 * Parse warnings and errors from build output
 */
function parseBuildOutput(stdout: string, stderr: string): {
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  const combinedOutput = stdout + "\n" + stderr;
  const lines = combinedOutput.split("\n");

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Check for errors
    if (lowerLine.includes("error") && !lowerLine.includes("0 error")) {
      errors.push(line.trim());
    }
    // Check for warnings
    else if (lowerLine.includes("warning") && !lowerLine.includes("0 warning")) {
      warnings.push(line.trim());
    }
  }

  // Deduplicate and limit
  return {
    warnings: [...new Set(warnings)].slice(0, 20),
    errors: [...new Set(errors)].slice(0, 20)
  };
}

/**
 * Main handler
 */
export async function handleBuildProject(args: Record<string, unknown>) {
  const params = args as unknown as BuildProjectParams;
  const {
    taskId,
    projectPath = process.cwd(),
    buildType = "production",
    target = "auto-detect",
    outputPath: customOutputPath,
    installDeps = true,
    env,
    timeout = 600000
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

  // Detect build system
  const buildSystem = detectBuildSystem(absolutePath);
  if (!buildSystem) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: "빌드 시스템을 감지할 수 없습니다.",
          suggestion: "package.json, CMakeLists.txt, Cargo.toml 등의 빌드 설정 파일이 있는지 확인해주세요.",
          checkedPaths: [
            path.join(absolutePath, "package.json"),
            path.join(absolutePath, "CMakeLists.txt"),
            path.join(absolutePath, "Cargo.toml"),
            path.join(absolutePath, "pyproject.toml")
          ]
        }, null, 2)
      }],
      isError: true
    };
  }

  const startTime = Date.now();
  let allStdout = "";
  let allStderr = "";

  // Handle C++ package dependencies (vcpkg/Homebrew)
  if (buildSystem.type === "cpp" && installDeps) {
    const cppDepResult = await handleCppDependencies(absolutePath);

    if (cppDepResult.toolchainFile) {
      // Update CMake command to include toolchain file
      buildSystem.installCommand = `cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE="${cppDepResult.toolchainFile}"`;
      allStdout += cppDepResult.message + "\n";
    } else if (cppDepResult.warning) {
      // Non-critical warning (vcpkg not found but continuing)
      allStdout += cppDepResult.warning + "\n";
    }

    if (cppDepResult.error && cppDepResult.critical) {
      // Critical error - stop build
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            buildSystem: buildSystem.name,
            error: "C++ 패키지 설치 실패",
            details: cppDepResult.error,
            suggestion: cppDepResult.suggestion,
            output: allStdout.slice(-2000)
          }, null, 2)
        }],
        isError: true
      };
    }
  }

  // Install dependencies if needed
  if (installDeps && buildSystem.installCommand) {
    const installResult = executeCommand(
      buildSystem.installCommand,
      absolutePath,
      timeout / 2,
      env
    );
    allStdout += installResult.stdout + "\n";
    allStderr += installResult.stderr + "\n";

    if (installResult.exitCode !== 0) {
      const { warnings, errors } = parseBuildOutput(allStdout, allStderr);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            buildSystem: buildSystem.name,
            error: "의존성 설치 실패",
            errors,
            warnings,
            command: buildSystem.installCommand,
            output: (allStdout + allStderr).slice(-2000)
          }, null, 2)
        }],
        isError: true
      };
    }
  }

  // Select build command based on type
  let buildCommand = buildSystem.buildCommand;
  if (buildType === "development" && buildSystem.devCommand) {
    buildCommand = buildSystem.devCommand;
  } else if (buildType === "production" && buildSystem.prodCommand) {
    buildCommand = buildSystem.prodCommand;
  }

  // Execute build
  const buildResult = executeCommand(buildCommand, absolutePath, timeout, env);
  allStdout += buildResult.stdout;
  allStderr += buildResult.stderr;

  const buildTime = Date.now() - startTime;

  // Determine output path
  const outputPath = customOutputPath || getOutputDirectory(absolutePath, buildSystem);

  // Collect artifacts
  const artifacts = collectArtifacts(outputPath);
  const totalSize = artifacts.reduce((sum, a) => sum + a.size, 0);

  // Parse warnings and errors
  const { warnings, errors } = parseBuildOutput(allStdout, allStderr);

  // Determine success
  const success = buildResult.exitCode === 0;

  // Build result object
  const result: BuildResult = {
    success,
    buildSystem: buildSystem.name,
    buildType,
    buildTime,
    outputPath,
    artifacts: artifacts.slice(0, 50), // Limit to 50 artifacts
    totalSize,
    warnings,
    errors,
    command: buildCommand
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
              action: "run",
              message: "빌드 성공. 로컬 실행을 진행하세요.",
              tool: "avengers_run_local",
              params: {
                taskId,
                projectPath: absolutePath
              }
            }
          : {
              action: "fix",
              message: "빌드 실패. 에러를 수정하세요.",
              errors
            }
      }, null, 2)
    }]
  };
}

/**
 * Build human-readable result message
 */
function buildResultMessage(result: BuildResult, taskId: string): string {
  const lines: string[] = [
    `## 빌드 결과`,
    ``,
    `**태스크**: ${taskId}`,
    `**빌드 시스템**: ${result.buildSystem}`,
    `**빌드 유형**: ${result.buildType}`,
    `**상태**: ${result.success ? "✅ 성공" : "❌ 실패"}`,
    `**빌드 시간**: ${(result.buildTime / 1000).toFixed(2)}s`,
    ``
  ];

  // Artifacts summary
  if (result.artifacts.length > 0) {
    lines.push(`### 빌드 아티팩트`);
    lines.push(`- 출력 경로: ${result.outputPath}`);
    lines.push(`- 파일 수: ${result.artifacts.length}`);
    lines.push(`- 총 크기: ${formatSize(result.totalSize)}`);
    lines.push(``);

    // List major artifacts
    const majorArtifacts = result.artifacts
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);

    lines.push(`### 주요 파일`);
    for (const artifact of majorArtifacts) {
      lines.push(`- ${artifact.name} (${formatSize(artifact.size)})`);
    }
    lines.push(``);
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push(`### ⚠️ 경고 (${result.warnings.length}개)`);
    for (const warning of result.warnings.slice(0, 5)) {
      lines.push(`- ${warning.slice(0, 100)}`);
    }
    if (result.warnings.length > 5) {
      lines.push(`- ... 외 ${result.warnings.length - 5}개`);
    }
    lines.push(``);
  }

  // Errors
  if (result.errors.length > 0) {
    lines.push(`### ❌ 에러 (${result.errors.length}개)`);
    for (const error of result.errors.slice(0, 5)) {
      lines.push(`- ${error.slice(0, 100)}`);
    }
    if (result.errors.length > 5) {
      lines.push(`- ... 외 ${result.errors.length - 5}개`);
    }
  }

  return lines.join("\n");
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Handle C++ package dependencies using vcpkg/Homebrew
 * Auto-installs vcpkg if not found on Windows
 * POC: Auto-install fmt library for testing
 */
async function handleCppDependencies(projectPath: string): Promise<{
  message?: string;
  warning?: string;
  error?: string;
  critical?: boolean;
  suggestion?: string;
  toolchainFile?: string;
}> {
  const os = process.platform;
  const isWindows = os === "win32";
  const isMacOS = os === "darwin";

  // 1. Check if CMakeLists.txt exists and has find_package calls
  const cmakeListsPath = path.join(projectPath, "CMakeLists.txt");
  if (!fs.existsSync(cmakeListsPath)) {
    return {
      message: "CMakeLists.txt not found - skipping package setup"
    };
  }

  const cmakeContent = fs.readFileSync(cmakeListsPath, "utf-8");
  if (!cmakeContent.includes("find_package(")) {
    return {
      message: "No external packages required (no find_package calls) - skipping package setup"
    };
  }

  // 2. Detect package manager
  let packageManager: "vcpkg" | "homebrew" | "none" = "none";
  let toolchainFile: string | null = null;

  if (isWindows) {
    try {
      execSync("vcpkg --version", { encoding: "utf-8", stdio: "pipe" });
      packageManager = "vcpkg";

      // Find vcpkg root and toolchain file
      const vcpkgRoot = process.env.VCPKG_ROOT;
      if (vcpkgRoot) {
        toolchainFile = path.join(vcpkgRoot, "scripts", "buildsystems", "vcpkg.cmake");
      }
    } catch {
      // vcpkg not found - auto-install it
      const installResult = await autoInstallVcpkg();
      if (installResult.success && installResult.toolchainFile) {
        packageManager = "vcpkg";
        toolchainFile = installResult.toolchainFile;
      } else {
        return {
          warning: installResult.warning || "⚠️ Failed to auto-install vcpkg. Please install manually.",
          suggestion: installResult.suggestion || "Visit: https://github.com/microsoft/vcpkg"
        };
      }
    }
  } else if (isMacOS) {
    try {
      execSync("brew --version", { encoding: "utf-8", stdio: "pipe" });
      packageManager = "homebrew";
    } catch {
      return {
        warning: "⚠️ Homebrew not installed. Please install it manually.",
        suggestion: "Visit: https://brew.sh"
      };
    }
  }

  // 3. If still no package manager, return warning
  if (packageManager === "none") {
    return {
      warning: "⚠️ No package manager found (vcpkg/Homebrew). Packages must be installed manually.",
      suggestion: "Windows: Install vcpkg - https://github.com/microsoft/vcpkg\nmacOS: Install Homebrew - https://brew.sh"
    };
  }

  // 4. POC: Auto-install fmt (lightweight, fast)
  const message: string[] = [
    `✅ Detected package manager: ${packageManager}`,
    `📦 Installing fmt library (POC)...`
  ];

  try {
    if (packageManager === "vcpkg") {
      // Check if fmt is already installed
      try {
        execSync("vcpkg list", { encoding: "utf-8", stdio: "pipe" }).includes("fmt");
        message.push("✅ fmt already installed (skipping)");
      } catch {
        // fmt not found, install it
        message.push("Installing fmt:x64-windows...");
        execSync("vcpkg install fmt:x64-windows", {
          encoding: "utf-8",
          cwd: projectPath,
          timeout: 600000  // 10 minutes for installation
        });
        message.push("✅ fmt installed successfully");
      }
    } else if (packageManager === "homebrew") {
      // Check if fmt is installed
      try {
        execSync("brew list fmt", { encoding: "utf-8", stdio: "pipe" });
        message.push("✅ fmt already installed (skipping)");
      } catch {
        // fmt not installed, install it
        message.push("Installing fmt...");
        execSync("brew install fmt", {
          encoding: "utf-8",
          cwd: projectPath,
          timeout: 600000
        });
        message.push("✅ fmt installed successfully");
      }
    }

    // 5. Return success with toolchain info
    if (toolchainFile && fs.existsSync(toolchainFile)) {
      message.push(`✅ CMake toolchain: ${toolchainFile}`);
      return {
        message: message.join("\n"),
        toolchainFile
      };
    } else {
      message.push("ℹ️ No explicit toolchain needed (Homebrew)");
      return {
        message: message.join("\n")
      };
    }
  } catch (error) {
    // Installation failed but non-critical for POC
    return {
      warning: `⚠️ Package installation encountered an issue: ${error instanceof Error ? error.message : String(error)}\n\nContinuing with build (manual install may be needed)`,
      toolchainFile: toolchainFile ?? undefined
    };
  }
}

/**
 * Auto-install vcpkg on Windows if not found
 */
async function autoInstallVcpkg(): Promise<{
  success: boolean;
  toolchainFile?: string;
  warning?: string;
  suggestion?: string;
}> {
  try {
    const message: string[] = [];

    // 1. Determine vcpkg installation location
    const vcpkgRoot = "C:\\vcpkg";  // Standard Windows location

    message.push("📦 vcpkg not found - auto-installing...");

    // 2. Check if already partially installed
    if (fs.existsSync(vcpkgRoot)) {
      message.push("✅ vcpkg directory exists, attempting bootstrap...");

      try {
        // Try to bootstrap existing installation
        execSync(`.\\bootstrap-vcpkg.bat`, {
          cwd: vcpkgRoot,
          encoding: "utf-8",
          timeout: 300000  // 5 minutes for bootstrap
        });
        message.push("✅ vcpkg bootstrapped successfully");
      } catch (bootstrapError) {
        // Bootstrap failed, try full installation
        message.push("⚠️ Bootstrap failed, attempting full clone...");
        fs.rmSync(vcpkgRoot, { recursive: true, force: true });
      }
    }

    // 3. If directory doesn't exist, clone from GitHub
    if (!fs.existsSync(vcpkgRoot)) {
      message.push("🔄 Cloning vcpkg repository...");

      execSync(
        `git clone https://github.com/microsoft/vcpkg.git "${vcpkgRoot}"`,
        {
          encoding: "utf-8",
          timeout: 600000,  // 10 minutes for clone
          stdio: "pipe"
        }
      );
      message.push("✅ vcpkg cloned successfully");

      // 4. Bootstrap vcpkg
      message.push("⚙️ Bootstrapping vcpkg...");
      execSync(`.\\bootstrap-vcpkg.bat`, {
        cwd: vcpkgRoot,
        encoding: "utf-8",
        timeout: 300000
      });
      message.push("✅ vcpkg bootstrapped successfully");
    }

    // 5. Verify vcpkg installation
    const versionOutput = execSync(`"${vcpkgRoot}\\vcpkg" --version`, {
      encoding: "utf-8",
      timeout: 30000
    });
    message.push(`✅ vcpkg version: ${versionOutput.trim().split("\n")[0]}`);

    // 6. Set VCPKG_ROOT environment variable
    const toolchainFile = path.join(vcpkgRoot, "scripts", "buildsystems", "vcpkg.cmake");

    // Set environment variable for current process
    process.env.VCPKG_ROOT = vcpkgRoot;

    // Try to set system environment variable (requires admin)
    try {
      execSync(`setx VCPKG_ROOT "${vcpkgRoot}"`, {
        encoding: "utf-8",
        timeout: 10000
      });
      message.push(`✅ Set VCPKG_ROOT environment variable: ${vcpkgRoot}`);
    } catch {
      message.push(`⚠️ Could not set system VCPKG_ROOT (requires admin). Set manually if needed.`);
    }

    return {
      success: true,
      toolchainFile,
      warning: message.join("\n")
    };
  } catch (error) {
    return {
      success: false,
      warning: `❌ Failed to auto-install vcpkg: ${error instanceof Error ? error.message : String(error)}`,
      suggestion: `Please install vcpkg manually from: https://github.com/microsoft/vcpkg\n\nQuick install:\n1. git clone https://github.com/microsoft/vcpkg.git C:\\vcpkg\n2. cd C:\\vcpkg\n3. .\\bootstrap-vcpkg.bat\n4. setx VCPKG_ROOT C:\\vcpkg`
    };
  }
}
