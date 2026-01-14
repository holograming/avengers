# C++ Package Management Skill

Automatically detect and install C++ dependencies for CMake projects using vcpkg (Windows) or Homebrew (macOS/Linux).

This skill solves a critical problem: CMake's `find_package()` expects libraries to already be installed, but unlike npm or pip, C++ has no standard, automatic package installation. This skill fills that gap.

---

## Quick Start

```typescript
// Auto-detect and manage all C++ dependencies
avengers_skill_cpp_packages({
  phase: "detect",
  projectPath: "/path/to/cpp/project"
})
```

---

## The Process

```
DETECT → ANALYZE → INSTALL → VERIFY → INTEGRATE → COMPLETE
```

The skill guides you through these 6 phases:

1. **DETECT**: Identify OS and available package managers
2. **ANALYZE**: Parse CMakeLists.txt for dependencies
3. **INSTALL**: Execute package manager commands
4. **VERIFY**: Validate packages are installed correctly
5. **INTEGRATE**: Set up CMake toolchain files
6. **COMPLETE**: Summary and next steps

---

## The Problem

### Frontend/Backend (Works ✅)
```bash
npm install      # → Downloads all packages automatically
pip install      # → Downloads all packages automatically
cmake --build    # → Works because dependencies are installed
```

### C++ (Broken ❌)
```bash
cmake -B build   # ❌ Fails immediately: "Qt6 not found"
                 # No automatic installation happened!
```

**Root cause**: CMake's `find_package(Qt6)` assumes Qt6 is **already installed**. There's no standard package manager to download it automatically like npm does.

---

## Phases

### Phase 1: detect

**Purpose**: Identify your system and available tools

```typescript
avengers_skill_cpp_packages({
  phase: "detect",
  projectPath: "/path/to/project"
})
```

**What it does**:
- Detects OS: Windows, macOS, Linux, WSL
- Finds available package managers: vcpkg, Homebrew, Conan, system PM
- Identifies CPU architecture: x64, arm64

**Output example**:
```
✅ OS: Windows
✅ Architecture: x64
✅ Available Package Managers: vcpkg
✅ Primary Manager: vcpkg
```

**Next step**: Call with `phase: "analyze"`

---

### Phase 2: analyze

**Purpose**: Parse your project and list required packages

```typescript
avengers_skill_cpp_packages({
  phase: "analyze",
  projectPath: "/path/to/project"
})
```

**What it does**:
- Reads CMakeLists.txt
- Finds all `find_package()` calls
- Extracts package names and components
- Maps to package manager names (Qt6 → qt6-base, fmt → fmt)

**Output example**:
```
✅ Analyzed CMakeLists.txt

📦 Found 2 package(s):
- fmt [REQUIRED]
- GoogleTest
```

**Supported packages** (with auto-mapping):
- fmt (1-2min install)
- nlohmann-json (1min)
- spdlog (2-3min)
- Boost (5-10min)
- OpenSSL (3-5min)
- CURL (2-3min)
- Qt6 (10-20min)
- GoogleTest (2-3min)

**Next step**: Call with `phase: "install"`

---

### Phase 3: install

**Purpose**: Install detected packages

```typescript
avengers_skill_cpp_packages({
  phase: "install",
  projectPath: "/path/to/project",
  autoInstall: true  // Install without asking
})
```

**What it does**:
- Checks which packages are already installed
- Runs installation command for missing packages
- Supports automatic retry on failure

**Platform-specific commands**:

**Windows (vcpkg)**:
```bash
vcpkg install fmt:x64-windows
# Takes 1-2 minutes for fmt
```

**macOS (Homebrew)**:
```bash
brew install fmt
# Takes 1-2 minutes for fmt
```

**Linux (Homebrew or apt)**:
```bash
brew install fmt
# OR
sudo apt-get install libfmt-dev
```

**Installation times**:
- fmt: 1-2 minutes ⚡
- spdlog: 2-3 minutes
- Boost: 5-10 minutes
- Qt6: 10-20 minutes
- Others: 2-5 minutes

**Next step**: Call with `phase: "verify"`

---

### Phase 4: verify

**Purpose**: Confirm packages are installed and CMake can find them

```typescript
avengers_skill_cpp_packages({
  phase: "verify",
  projectPath: "/path/to/project"
})
```

**What it does**:
1. Creates a test CMakeLists.txt
2. Attempts CMake configuration
3. Reports which packages were found

**Output example**:
```
✅ Verification Successful

Package 'fmt' is available and CMake can find it.
```

**If verification fails**:
```
⚠️ CMake Configuration Failed

Package may not be installed yet.
Install fmt and retry:
- Windows: vcpkg install fmt:x64-windows
- macOS: brew install fmt
```

**Next step**: Call with `phase: "integrate"`

---

### Phase 5: integrate

**Purpose**: Set up CMake toolchain files and build system integration

```typescript
avengers_skill_cpp_packages({
  phase: "integrate",
  projectPath: "/path/to/project"
})
```

**What it does**:

**For Windows (vcpkg)**:
- Locates vcpkg installation
- Returns toolchain file path
- Provides CMake command with `-DCMAKE_TOOLCHAIN_FILE`

Example output:
```
✅ Toolchain File Found

C:\vcpkg\scripts\buildsystems\vcpkg.cmake

Use in CMake:
cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE="C:\vcpkg\scripts\buildsystems\vcpkg.cmake"
```

**For macOS/Linux (Homebrew)**:
- Sets CMAKE_PREFIX_PATH automatically
- No additional configuration needed

**Next step**: Call with `phase: "complete"`

---

### Phase 6: complete

**Purpose**: Summarize and prepare for building

```typescript
avengers_skill_cpp_packages({
  phase: "complete",
  projectPath: "/path/to/project"
})
```

**Output**:
```
✅ C++ Package Management Complete!

Summary:
1. ✅ Platform detected
2. ✅ Dependencies analyzed
3. ✅ Packages ready to install
4. ✅ Installation verified
5. ✅ Build system configured

Next Steps:
cd /path/to/project
cmake -B build -S .
cmake --build build
```

---

## Full Workflow Example: fmt on Windows

### Initial State
- Windows PC with vcpkg installed
- C++ project with `find_package(fmt REQUIRED)` in CMakeLists.txt
- fmt is **not** installed

### Step-by-step

**1. Detect phase**:
```typescript
avengers_skill_cpp_packages({ phase: "detect", projectPath: "." })
```
Output:
```
✅ OS: Windows
✅ Available Package Managers: vcpkg
✅ Primary Manager: vcpkg
```

**2. Analyze phase**:
```typescript
avengers_skill_cpp_packages({ phase: "analyze", projectPath: "." })
```
Output:
```
📦 Found 1 package(s):
- fmt [REQUIRED]
```

**3. Install phase**:
```typescript
avengers_skill_cpp_packages({ phase: "install", projectPath: "." })
```
This will:
```
vcpkg install fmt:x64-windows
# ⏳ Waits 1-2 minutes...
# ✅ fmt downloaded and installed
```

**4. Verify phase**:
```typescript
avengers_skill_cpp_packages({ phase: "verify", projectPath: "." })
```
Output:
```
✅ Verification Successful
Package 'fmt' is available and CMake can find it.
```

**5. Integrate phase**:
```typescript
avengers_skill_cpp_packages({ phase: "integrate", projectPath: "." })
```
Output:
```
Toolchain File: C:\vcpkg\scripts\buildsystems\vcpkg.cmake
```

**6. Build!**
```bash
cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE="C:\vcpkg\scripts\buildsystems\vcpkg.cmake"
cmake --build build
```

---

## Best Practices

### 1. Always start with DETECT
This ensures you're using the right package manager for your OS.

### 2. Run phases in order
While you *can* skip phases, running them in sequence is most reliable.

### 3. Check architecture
For vcpkg, ensure you're using the correct triplet (x64, arm64, etc.)

### 4. Use manifest mode for reproducibility
Consider using `vcpkg.json` for version-locked dependencies:
```json
{
  "dependencies": ["fmt", "boost"]
}
```

### 5. Add to .gitignore
```bash
# Skip vcpkg directories in git
vcpkg_installed/
build/
```

---

## Troubleshooting

### ❌ "vcpkg not found"

**Windows**:
```bash
# Install vcpkg
git clone https://github.com/microsoft/vcpkg.git C:\vcpkg
cd C:\vcpkg
.\bootstrap-vcpkg.bat
setx VCPKG_ROOT C:\vcpkg
```

**macOS/Linux**:
```bash
brew install vcpkg
export VCPKG_ROOT=/usr/local/share/vcpkg
```

### ❌ "brew: Permission denied"

On macOS, Homebrew directories may have permission issues:
```bash
sudo chown -R $(whoami) /usr/local/*
sudo chown -R $(whoami) /opt/homebrew/*
```

### ❌ "Package not found in vcpkg"

Search for the correct package name:
```bash
vcpkg search fmt
# Output: fmt -- Modern C++ formatting library

# Then install with exact name
vcpkg install fmt:x64-windows
```

### ❌ "CMake configure still fails after install"

Verify the toolchain file is set correctly:
```bash
# Windows
cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE="C:\vcpkg\scripts\buildsystems\vcpkg.cmake"

# macOS
export CMAKE_PREFIX_PATH=/usr/local/opt/fmt
cmake -B build -S .
```

### ❌ Installation timeout

Increase timeout for large packages:
```bash
# Manually install with longer timeout
vcpkg install qt6-base:x64-windows  # May take 20+ minutes
```

---

## Supported Package Manager Features

### vcpkg (Windows)
- **Pros**: Pre-compiled binaries, fast, Windows-native
- **Cons**: Large repository download on first run (~2GB)
- **Best for**: Commercial Windows projects

### Homebrew (macOS/Linux)
- **Pros**: System-wide packages, easy updates
- **Cons**: Slower first install, requires compilation sometimes
- **Best for**: Open-source projects, quick iterations

### System PM (apt, yum)
- **Pros**: Native to Linux distros
- **Cons**: Older package versions, less control
- **Best for**: Server environments with strict versioning

---

## Integration with /assemble Command

This skill is automatically invoked by `/assemble` when it detects a C++ project:

```
User: /assemble
  ↓
/assemble detects CMakeLists.txt
  ↓
Calls avengers_skill_cpp_packages (detect → install → verify → integrate)
  ↓
CMake configuration with correct toolchain
  ↓
Build succeeds ✅
```

You can also manually control the process:
```typescript
// Skip auto-install
avengers_build_project({
  projectPath: ".",
  skipPackageSetup: true
})
```

---

## FAQ

**Q: Do I need to install vcpkg or Homebrew manually?**
A: Yes, this skill assumes you have one of these installed. The skill will show you installation links if not found.

**Q: Can I use multiple package managers?**
A: Recommended: one per OS. The skill auto-selects the best option.

**Q: What if my package isn't in the supported list?**
A: The skill can still install it, but you may need to specify the exact package manager name.

**Q: How long does a full install take?**
A: Usually 1-5 minutes for small libraries (fmt, spdlog), 10-20 minutes for large ones (Qt6, Boost).

**Q: Can I use this in CI/CD pipelines?**
A: Yes! The skill is designed for automated environments.

---

## References

- **vcpkg**: https://github.com/microsoft/vcpkg
- **Homebrew**: https://brew.sh
- **CMake find_package**: https://cmake.org/cmake/help/latest/command/find_package.html
- **fmt library**: https://fmt.dev

---

## Advanced Features (Roadmap)

- [ ] Conan package manager support
- [ ] Version pinning and constraint solving
- [ ] Cross-compilation support
- [ ] vcpkg presets integration
- [ ] Performance profiling for large packages
- [ ] Custom package mapping registry
