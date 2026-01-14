cmake_minimum_required(VERSION 3.16)
project(tossplace-desktop LANGUAGES CXX)

set(CMAKE_INCLUDE_CURRENT_DIR ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find Qt
find_package(Qt6 COMPONENTS
    Core
    Gui
    Qml
    Quick
    Sql
    Network
    REQUIRED
)

# Project version
set(TOSSPLACE_VERSION "0.1.0")
add_definitions(-DTOSSPLACE_VERSION="${TOSSPLACE_VERSION}")

# Source files
set(SOURCES
    src/main.cpp
    src/application.cpp
    src/core/database/database.cpp
    src/core/models/product.cpp
    src/core/services/authservice.cpp
    src/core/services/productservice.cpp
    src/core/bindings/authservicebinding.cpp
    src/core/bindings/productservicebinding.cpp
)

set(HEADERS
    src/application.h
    src/core/database/database.h
    src/core/models/user.h
    src/core/models/product.h
    src/core/services/authservice.h
    src/core/services/productservice.h
    src/core/bindings/authservicebinding.h
    src/core/bindings/productservicebinding.h
)

set(QML_SOURCES
    src/ui/main.qml
    src/ui/LoginScreen.qml
    src/ui/ProductListScreen.qml
    src/ui/ProductDetailScreen.qml
)

# Main executable
add_executable(${PROJECT_NAME}
    ${SOURCES}
    ${HEADERS}
    ${QML_SOURCES}
)

# Link libraries
target_link_libraries(${PROJECT_NAME}
    Qt6::Core
    Qt6::Gui
    Qt6::Qml
    Qt6::Quick
    Qt6::Sql
    Qt6::Network
)

# Include directories
target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

# Enable testing
enable_testing()
add_subdirectory(tests)

# Installation
install(TARGETS ${PROJECT_NAME}
    BUNDLE DESTINATION .
    RUNTIME DESTINATION bin
)
