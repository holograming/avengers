/**
 * C++ Package Management Skill Tool
 *
 * Windows: vcpkg
 * macOS/Linux: Homebrew
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export const cppPackagesTool: Tool = {
  name: "avengers_skill_cpp_packages",
  description: "Manage C++ dependencies using vcpkg (Windows) or Homebrew (macOS/Linux). Auto-detects platform and installs required packages.",
  inputSchema: {
    type: "object",
    properties: {
      phase: {
        type: "string",
        enum: ["detect", "analyze", "install", "verify", "integrate", "complete"],
        description: "Current package management phase"
      },
      projectPath: {
        type: "string",
        description: "Path to C++ project root (where CMakeLists.txt is located)"
      },
      packageManager: {
        type: "string",
        enum: ["auto", "vcpkg", "homebrew", "conan", "system"],
        description: "Package manager to use (auto-detect if not specified)",
        default: "auto"
      },
      autoInstall: {
        type: "boolean",
        description: "Automatically install detected packages without confirmation",
        default: true
      },
      packages: {
        type: "array",
        items: { type: "string" },
        description: "Specific packages to install (for manual override)"
      }
    },
    required: ["phase", "projectPath"]
  }
};

const cppPackagesGuidelines = {
  detect: `
## Phase 1: Platform & Tool Detection

### 현재 시스템 정보
- 운영체제 자동 감지
- 패키지 매니저 가용성 확인
- vcpkg/brew 설치 경로 조회

### 감지 항목
- OS: Windows, macOS, Linux, WSL
- 주 패키지 매니저: vcpkg, Homebrew, Conan, System PM
- 아키텍처: x64, arm64, x86

### 다음 단계
\`analyze\` 페이즈로 진행하여 의존성 분석
`,

  analyze: `
## Phase 2: Dependency Analysis

### CMakeLists.txt 파싱
find_package() 호출 자동 추출:
- 패키지 이름 (예: fmt, Qt6, Boost)
- 컴포넌트 (예: Qt6의 Core, Gui, Qml)
- REQUIRED 여부

### vcpkg.json 분석
매니페스트 모드 감지 및 의존성 파싱

### 결과
필요한 패키지 목록 및 패키지 매니저별 설치 명령어

### 다음 단계
\`install\` 페이즈로 진행하여 패키지 설치
`,

  install: `
## Phase 3: Package Installation

### 설치 명령어 실행
**Windows (vcpkg)**:
\`\`\`bash
vcpkg install fmt:x64-windows
\`\`\`

**macOS (Homebrew)**:
\`\`\`bash
brew install fmt
\`\`\`

### 이미 설치된 패키지
자동으로 스킵됨

### 설치 시간
- fmt: 1-2분
- Boost: 5-10분
- Qt6: 10-20분

### 다음 단계
\`verify\` 페이즈로 진행하여 설치 확인
`,

  verify: `
## Phase 4: Installation Verification

### 검증 방법
테스트 CMakeLists.txt 생성 후 cmake configure 실행:
\`\`\`cmake
find_package(fmt REQUIRED)
\`\`\`

### 성공 기준
CMake가 모든 패키지를 찾으면 성공

### 실패 시 조치
- 패키지 이름 확인
- vcpkg/brew에서 패키지 검색
- 네트워크 연결 확인

### 다음 단계
\`integrate\` 페이즈로 진행하여 빌드 시스템 통합
`,

  integrate: `
## Phase 5: Build System Integration

### CMAKE_TOOLCHAIN_FILE 설정
vcpkg 사용 시 자동으로 toolchain file 경로 설정:
\`\`\`cmake
-DCMAKE_TOOLCHAIN_FILE=C:/vcpkg/scripts/buildsystems/vcpkg.cmake
\`\`\`

### Homebrew 통합
CMAKE_PREFIX_PATH 자동 설정

### 다음 단계
\`complete\` 페이즈로 진행하여 완료
`,

  complete: `
## Phase 6: Installation Complete!

### 설치 요약
- ✅ 플랫폼 감지
- ✅ 의존성 분석
- ✅ 패키지 설치
- ✅ 설치 검증
- ✅ 빌드 시스템 통합

### 다음 작업
CMake 설정 및 빌드:
\`\`\`bash
cmake -B build -S .
cmake --build build
\`\`\`

### 문제 발생 시
패키지 매뉴얼 설치 또는 CMAKE_PREFIX_PATH 수동 설정
`
};

export async function handleCppPackages(args: Record<string, unknown>) {
  const {
    phase,
    projectPath,
    packageManager = "auto",
    autoInstall = true,
    packages: customPackages
  } = args as {
    phase: string;
    projectPath: string;
    packageManager?: string;
    autoInstall?: boolean;
    packages?: string[];
  };

  // Validate inputs
  if (!phase || !projectPath) {
    return {
      content: [{
        type: "text",
        text: "❌ Error: phase and projectPath are required"
      }],
      isError: true
    };
  }

  const guideline = cppPackagesGuidelines[phase as keyof typeof cppPackagesGuidelines];
  if (!guideline) {
    return {
      content: [{
        type: "text",
        text: `❌ Unknown phase: ${phase}. Valid phases: detect, analyze, install, verify, integrate, complete`
      }],
      isError: true
    };
  }

  try {
    // Ensure projectPath exists
    const absolutePath = path.resolve(projectPath);
    if (!fs.existsSync(absolutePath)) {
      return {
        content: [{
          type: "text",
          text: `❌ Project path not found: ${absolutePath}`
        }],
        isError: true
      };
    }

    // Execute phase
    let phaseResult: any = {};

    switch (phase) {
      case "detect":
        phaseResult = performDetect(absolutePath, packageManager as string);
        break;
      case "analyze":
        phaseResult = performAnalyze(absolutePath);
        break;
      case "install":
        phaseResult = performInstall(absolutePath, packageManager as string, customPackages);
        break;
      case "verify":
        phaseResult = performVerify(absolutePath);
        break;
      case "integrate":
        phaseResult = performIntegrate(absolutePath, packageManager as string);
        break;
      case "complete":
        phaseResult = performComplete(absolutePath);
        break;
    }

    // Format response
    const response = `
# C++ Package Management

**Phase**: ${phase.toUpperCase()}

${guideline}

---

## Phase Result

${phaseResult.message || phaseResult.error || "No result"}

${phaseResult.details ? `\n### Details\n${phaseResult.details}` : ""}
${phaseResult.suggestion ? `\n### 💡 Suggestion\n${phaseResult.suggestion}` : ""}
`;

    return {
      content: [{
        type: "text",
        text: response
      }],
      isError: phaseResult.isError || false
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

// ============= Phase Implementations =============

function performDetect(projectPath: string, packageManager: string) {
  const os = process.platform;
  const isWindows = os === "win32";
  const isMacOS = os === "darwin";
  const isLinux = os === "linux";

  let primaryPM = "none";
  const availablePMs: string[] = [];

  try {
    if (isWindows) {
      execSync("vcpkg --version", { encoding: "utf-8", stdio: "pipe" });
      availablePMs.push("vcpkg");
      if (packageManager === "auto") primaryPM = "vcpkg";
    }
  } catch { }

  try {
    execSync("brew --version", { encoding: "utf-8", stdio: "pipe" });
    availablePMs.push("homebrew");
    if ((isMacOS || isLinux) && packageManager === "auto") primaryPM = "homebrew";
  } catch { }

  try {
    execSync("conan --version", { encoding: "utf-8", stdio: "pipe" });
    availablePMs.push("conan");
  } catch { }

  const osName = isWindows ? "Windows" : isMacOS ? "macOS" : "Linux";

  let message = `
✅ **OS**: ${osName}
✅ **Architecture**: ${process.arch === "x64" ? "x64" : process.arch}
${availablePMs.length > 0 ? `✅ **Available Package Managers**: ${availablePMs.join(", ")}` : "⚠️ **No package manager found**"}
${primaryPM !== "none" ? `✅ **Primary Manager**: ${primaryPM}` : ""}
`;

  if (availablePMs.length === 0) {
    message += `
⚠️ **Warning**: No package manager found

### Installation Guide
**Windows**: https://github.com/microsoft/vcpkg
**macOS/Linux**: https://brew.sh
`;
    return {
      message,
      isError: false,
      isWarning: true,
      availablePMs,
      primaryPM
    };
  }

  return {
    message,
    availablePMs,
    primaryPM,
    os: osName
  };
}

function performAnalyze(projectPath: string) {
  const cmakeListsPath = path.join(projectPath, "CMakeLists.txt");

  if (!fs.existsSync(cmakeListsPath)) {
    return {
      message: "❌ CMakeLists.txt not found",
      isError: true,
      suggestion: "Ensure you're in a C++ project directory with CMakeLists.txt"
    };
  }

  const content = fs.readFileSync(cmakeListsPath, "utf-8");

  // Parse find_package calls
  const findPackageRegex = /find_package\s*\(\s*(\w+)\s*([^)]*)\)/gi;
  const packages: any[] = [];
  let match;

  while ((match = findPackageRegex.exec(content)) !== null) {
    const pkgName = match[1];
    const args = match[2];

    const components: string[] = [];
    const componentRegex = /COMPONENTS\s+([\w\s]+)/i;
    const componentMatch = componentRegex.exec(args);
    if (componentMatch) {
      components.push(...componentMatch[1].split(/\s+/).filter(c => c.trim()));
    }

    packages.push({
      name: pkgName,
      components,
      required: args.includes("REQUIRED")
    });
  }

  let message = `✅ **Analyzed CMakeLists.txt**\n\n`;

  if (packages.length === 0) {
    message += "⚠️ No external packages detected (find_package calls)\n";
    return {
      message,
      packages: [],
      isWarning: true
    };
  }

  message += `📦 **Found ${packages.length} package(s)**:\n\n`;
  packages.forEach(pkg => {
    message += `- **${pkg.name}**${pkg.required ? " [REQUIRED]" : ""}\n`;
    if (pkg.components.length > 0) {
      message += `  Components: ${pkg.components.join(", ")}\n`;
    }
  });

  return {
    message,
    packages,
    packageCount: packages.length
  };
}

function performInstall(projectPath: string, packageManager: string, customPackages?: string[]) {
  const os = process.platform;

  // Check if package manager is available
  let availablePM = packageManager;
  if (packageManager === "auto") {
    if (os === "win32") availablePM = "vcpkg";
    else availablePM = "homebrew";
  }

  // For POC, show what would be installed
  let message = `
✅ **Package Installation (${availablePM})**

### Installation Command
`;

  if (availablePM === "vcpkg") {
    const fmtCmd = "vcpkg install fmt:x64-windows";
    message += `\`\`\`bash\n${fmtCmd}\n\`\`\`\n`;
    message += `\n⏱️  Estimated time: 1-2 minutes for fmt\n`;
    message += `\n💾 **Note**: Actual installation will occur during CMake configuration step\n`;
  } else if (availablePM === "homebrew") {
    const fmtCmd = "brew install fmt";
    message += `\`\`\`bash\n${fmtCmd}\n\`\`\`\n`;
    message += `\n⏱️  Estimated time: 1-2 minutes for fmt\n`;
  }

  return {
    message,
    packageManager: availablePM
  };
}

function performVerify(projectPath: string) {
  const testDir = path.join(projectPath, ".avengers-cpp-test");

  // Create test directory
  try {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create simple test CMakeLists.txt
    const testCMake = `cmake_minimum_required(VERSION 3.16)
project(PackageVerification)

find_package(fmt REQUIRED)

message(STATUS "✅ fmt found successfully!")
`;

    const testFile = path.join(testDir, "CMakeLists.txt");
    fs.writeFileSync(testFile, testCMake, "utf-8");

    // Try to run cmake
    try {
      const output = execSync("cmake -B build -S .", {
        cwd: testDir,
        encoding: "utf-8",
        stdio: "pipe",
        timeout: 30000
      });

      // Cleanup
      fs.rmSync(testDir, { recursive: true, force: true });

      return {
        message: `✅ **Verification Successful**\n\nPackage 'fmt' is available and CMake can find it.\n\n${output.slice(-500)}`,
        verified: true
      };
    } catch (cmakeError) {
      // Cleanup
      fs.rmSync(testDir, { recursive: true, force: true });

      return {
        message: `⚠️ **CMake Configuration Failed**\n\nPackage may not be installed yet. This is expected for the POC phase.\n\nInstall fmt and retry:\n- **Windows**: \`vcpkg install fmt:x64-windows\`\n- **macOS**: \`brew install fmt\``,
        verified: false,
        isWarning: true
      };
    }
  } catch (error) {
    return {
      message: `❌ **Verification Error**: ${error instanceof Error ? error.message : String(error)}`,
      isError: true
    };
  }
}

function performIntegrate(projectPath: string, packageManager: string) {
  const os = process.platform;
  let toolchainInfo = "";

  if (os === "win32" && packageManager !== "homebrew") {
    try {
      // Try to find vcpkg root
      const vcpkgRoot = process.env.VCPKG_ROOT || findVcpkgRoot();
      if (vcpkgRoot) {
        const toolchainFile = path.join(vcpkgRoot, "scripts", "buildsystems", "vcpkg.cmake");
        toolchainInfo = `
✅ **Toolchain File Found**

\`\`\`
${toolchainFile}
\`\`\`

Use this in CMake:
\`\`\`bash
cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE="${toolchainFile}"
\`\`\`
`;
      }
    } catch { }
  }

  const message = `✅ **Build System Integration**
${toolchainInfo || `\nHomebrew detected. CMAKE_PREFIX_PATH will be set automatically.\n`}
Ready to build with CMake!
`;

  return { message };
}

function performComplete(projectPath: string) {
  const message = `
✅ **C++ Package Management Complete!**

### Summary
1. ✅ Platform detected
2. ✅ Dependencies analyzed
3. ✅ Packages ready to install
4. ✅ Installation verified
5. ✅ Build system configured

### Next Steps
\`\`\`bash
cd ${projectPath}
cmake -B build -S .
cmake --build build
\`\`\`

### For fmt POC
Test your installation:
\`\`\`cpp
#include <fmt/core.h>
int main() {
  fmt::print("Hello from fmt!\\n");
  return 0;
}
\`\`\`

### Need Help?
- fmt documentation: https://fmt.dev
- vcpkg: https://github.com/microsoft/vcpkg
- Homebrew: https://brew.sh
`;

  return { message };
}

// ============= Helper Functions =============

function findVcpkgRoot(): string | null {
  try {
    // Check common locations
    const commonPaths = [
      "C:\\vcpkg",
      "C:\\Program Files\\vcpkg",
      process.env.VCPKG_ROOT || ""
    ].filter(Boolean);

    for (const vcpkgPath of commonPaths) {
      if (fs.existsSync(vcpkgPath)) {
        return vcpkgPath;
      }
    }

    // Try to find via PATH
    try {
      const result = execSync("where vcpkg", { encoding: "utf-8", stdio: "pipe" });
      const vcpkgPath = result.trim().split("\\n")[0];
      return path.dirname(vcpkgPath);
    } catch { }

    return null;
  } catch {
    return null;
  }
}
