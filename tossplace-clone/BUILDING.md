# Building Tossplace Clone

This guide provides detailed instructions for building the Tossplace Clone desktop application on different platforms.

## Prerequisites

### All Platforms
- **CMake**: 3.16 or later
- **C++ Compiler**: Supporting C++17
- **Git**: For version control
- **Qt6**: Complete development framework

### Windows
- **Visual Studio**: 2022 Community/Professional with C++ development tools
- **MSVC**: v142 or later
- **Windows SDK**: Latest version

### macOS
- **Xcode**: 13.0 or later
- **Clang**: Included with Xcode
- **macOS SDK**: 10.13 or later

### Linux
- **GCC**: 9.0+ or Clang 10.0+
- **X11 Development**: libx11-dev (Ubuntu/Debian)
- **OpenGL Development**: libgl1-mesa-dev (Ubuntu/Debian)

## Qt6 Installation

### Option 1: Qt Online Installer (Recommended)
1. Download Qt Online Installer from [qt.io](https://www.qt.io/download)
2. Run installer and create Qt account
3. Select **Qt 6.x** (latest version)
4. Choose components:
   - Qt 6.x for your platform
   - CMake
   - Build tools
5. Note installation path (e.g., `C:/Qt/6.x.0` on Windows)

### Option 2: Homebrew (macOS)
```bash
brew install qt6
```

### Option 3: Package Manager (Linux)
```bash
# Ubuntu/Debian
sudo apt-get install qt6-base qt6-qml qt6-quick

# Fedora
sudo dnf install qt6-qtbase qt6-qtdeclarative

# Arch
sudo pacman -S qt6-base qt6-declarative
```

## Windows Build

### 1. Install Dependencies
- Visual Studio 2022 (Community Edition is fine)
- Qt6 (via Online Installer)
- CMake (include in Visual Studio or install separately)

### 2. Configure Environment
```cmd
# Set Qt path (adjust to your installation)
set Qt6_DIR=C:\Qt\6.6.0\msvc2022_64

# Or add to Environment Variables (Control Panel > System > Advanced)
# User variable: Qt6_DIR = C:\Qt\6.6.0\msvc2022_64
```

### 3. Build Project
```cmd
cd tossplace-clone\desktop
mkdir build
cd build

# Configure
cmake .. -DCMAKE_BUILD_TYPE=Release -G "Visual Studio 17 2022"

# Build
cmake --build . --config Release

# Alternative: Use MSBuild directly
msbuild ALL_BUILD.vcxproj /p:Configuration=Release
```

### 4. Run Application
```cmd
# From build directory
Release\tossplace-desktop.exe

# Or from source directory
.\build\Release\tossplace-desktop.exe
```

### Troubleshooting Windows Build

**Error: "Could not find Qt"**
```cmd
# Explicitly set Qt path during configuration
cmake .. -DQt6_DIR=C:\Qt\6.6.0\msvc2022_64\lib\cmake\Qt6
```

**Error: "MSVC compiler not found"**
- Install Visual Studio C++ development tools
- Run build from Visual Studio Command Prompt
- Or set MSVC compiler path in CMake

**Error: "Cannot find moc.exe"**
- Ensure Qt6 bin directory is in PATH
- Or set CMAKE_PREFIX_PATH to Qt installation

## macOS Build

### 1. Install Dependencies
```bash
# Via Homebrew
brew install cmake qt6

# Or use Qt Online Installer
```

### 2. Configure Environment (if not using Homebrew)
```bash
export Qt6_DIR=/path/to/Qt/6.x.0/macos/lib/cmake/Qt6
export PATH="/path/to/Qt/6.x.0/macos/bin:$PATH"
```

### 3. Build Project
```bash
cd tossplace-clone/desktop
mkdir build
cd build

# Configure (uses Clang automatically on macOS)
cmake .. -DCMAKE_BUILD_TYPE=Release

# Build
cmake --build . --config Release
```

### 4. Run Application
```bash
# From build directory
./tossplace-desktop

# As macOS application bundle
open tossplace-desktop.app
```

### Create App Bundle (Optional)
```bash
# Prepare for distribution
mkdir -p tossplace-desktop.app/Contents/MacOS
mkdir -p tossplace-desktop.app/Contents/Resources

cp tossplace-desktop tossplace-desktop.app/Contents/MacOS/
cp ../src/ui/*.qml tossplace-desktop.app/Contents/Resources/

# Run with macOS framework
open tossplace-desktop.app
```

### Troubleshooting macOS Build

**Error: "Qt not found"**
```bash
# Check Qt installation
brew list qt6

# Set path explicitly
export Qt6_DIR=$(brew --prefix qt6)/lib/cmake/Qt6
```

**Error: "Clang not found"**
```bash
# Install Xcode command line tools
xcode-select --install
```

## Linux Build

### 1. Install Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y \
    build-essential cmake \
    qt6-base-dev qt6-declarative-dev \
    libgl1-mesa-dev libx11-dev \
    git
```

**Fedora:**
```bash
sudo dnf install -y \
    gcc-c++ cmake \
    qt6-qtbase-devel qt6-qtdeclarative-devel \
    mesa-libGL-devel \
    git
```

**Arch Linux:**
```bash
sudo pacman -S \
    base-devel cmake \
    qt6-base qt6-declarative \
    git
```

### 2. Configure Environment
```bash
# Usually automatic with system packages
# If using manual Qt installation:
export Qt6_DIR=/path/to/Qt/6.x.0/gcc_64/lib/cmake/Qt6
```

### 3. Build Project
```bash
cd tossplace-clone/desktop
mkdir build
cd build

# Configure
cmake .. -DCMAKE_BUILD_TYPE=Release

# Build (use -j for parallel compilation)
cmake --build . -- -j$(nproc)
```

### 4. Run Application
```bash
# From build directory
./tossplace-desktop

# Set library path if needed
LD_LIBRARY_PATH=/path/to/Qt/6.x.0/lib:$LD_LIBRARY_PATH ./tossplace-desktop
```

### Install System-Wide (Optional)
```bash
# From build directory
sudo cmake --install . --prefix /usr/local

# Run from anywhere
tossplace-desktop

# Uninstall
cd build
sudo xargs rm < install_manifest.txt
```

### Troubleshooting Linux Build

**Error: "Qt6 not found"**
```bash
# Find Qt installation
find /usr -name "Qt6Config.cmake" 2>/dev/null

# Set path
export Qt6_DIR=/path/to/Qt6Config.cmake/..
```

**Error: "libGL.so not found"**
```bash
# Install OpenGL development files
sudo apt-get install libgl1-mesa-dev

# Or for Fedora
sudo dnf install mesa-libGL-devel
```

**Error: "X11 not found"**
```bash
# Install X11 development files
sudo apt-get install libx11-dev

# Or for Fedora
sudo dnf install libX11-devel
```

## Build Variants

### Debug Build
```bash
cmake .. -DCMAKE_BUILD_TYPE=Debug

# Enables:
# - Debug symbols
# - Assertions
# - Slower performance
# - Better error messages
```

### Release Build
```bash
cmake .. -DCMAKE_BUILD_TYPE=Release

# Enables:
# - Optimizations (-O3)
# - Stripped symbols
# - Better performance
# - Smaller binary
```

### RelWithDebInfo (Recommended)
```bash
cmake .. -DCMAKE_BUILD_TYPE=RelWithDebInfo

# Combines:
# - Release optimizations
# - Debug symbols
# - Better for production with debugging capability
```

## Building Tests

Tests are built automatically with the main project:

```bash
cd build

# Run all tests
ctest

# Run specific test
ctest -R test_auth -V

# Run with verbose output
ctest --verbose

# Run tests from built directory
./test_database
./test_auth
./test_product
```

## Building Documentation

### Generate API Documentation (with Doxygen)
```bash
# Install Doxygen
# Windows: Download from doxygen.nl
# macOS: brew install doxygen
# Linux: sudo apt-get install doxygen

# Generate docs
cd tossplace-clone/desktop
doxygen Doxyfile

# Open documentation
open docs/html/index.html
```

## Cross-Compilation

### Windows → Linux (not recommended)
Use Docker or WSL2:
```bash
# In WSL2 Ubuntu environment
cd /mnt/c/path/to/tossplace-clone/desktop
# Follow Linux build steps
```

### For ARM/Embedded
```bash
# Install ARM compiler
sudo apt-get install g++-arm-linux-gnueabihf cmake-arm-toolchain

# Configure for ARM
cmake .. -DCMAKE_TOOLCHAIN_FILE=arm-toolchain.cmake
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@v2

      - name: Install Qt
        uses: jurplel/install-qt-action@v3
        with:
          version: '6.6.0'

      - name: Build
        run: |
          mkdir build
          cd build
          cmake ..
          cmake --build .

      - name: Test
        run: cd build && ctest
```

## Troubleshooting Build Issues

### General Issues

**Error: "CMake version too old"**
```bash
# Update CMake
# Windows: Download from cmake.org
# macOS: brew upgrade cmake
# Linux: sudo apt-get upgrade cmake
```

**Error: "C++ compiler not found"**
```bash
# Install compiler
# Windows: Visual Studio Build Tools
# macOS: xcode-select --install
# Linux: sudo apt-get install build-essential
```

**Error: "Qt version mismatch"**
```bash
# Clear CMake cache and rebuild
rm -rf build
mkdir build
cd build
cmake ..
```

### Platform-Specific Issues

See the platform-specific troubleshooting sections above.

## Building for Distribution

### Windows MSI Installer
```bash
# Install NSIS
# Download from nsis.sourceforge.io

# Create installer script
# Run NSIS: makensis installer.nsi
```

### macOS DMG Distribution
```bash
# Create DMG
hdiutil create -volname "Tossplace" \
    -srcfolder build/Release \
    -ov -format UDZO tossplace.dmg
```

### Linux AppImage
```bash
# Download linuxdeployqt
wget https://github.com/probonopd/linuxdeployqt/releases/download/7/linuxdeployqt-7-x86_64.AppImage

# Create AppImage
./linuxdeployqt-7-x86_64.AppImage build/tossplace-desktop -appimage
```

## Clean Build

To completely clean and rebuild:

```bash
# Remove build directory
rm -rf build          # Linux/macOS
rmdir /s build        # Windows

# Recreate and build
mkdir build
cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build .
```

## Performance Profiling

### Linux with Perf
```bash
# Build with debug symbols
cmake .. -DCMAKE_BUILD_TYPE=RelWithDebInfo
cmake --build .

# Profile
perf record ./tossplace-desktop
perf report
```

### Windows with Visual Studio Profiler
```
Debug → Start Diagnostic Tools
Select "CPU Usage" or "Memory Usage"
Run application
```

---

**For additional help, see ARCHITECTURE.md and README.md**

**Last Updated: 2026-01-14**
