cmake_minimum_required(VERSION 3.20)
project(TossplaceClone)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# Find Qt6 packages
find_package(Qt6 COMPONENTS
    Core
    Gui
    Qml
    Quick
    Sql
    Network
    Test
    REQUIRED
)

# Source files
set(SOURCES
    src/main.cpp
    src/ApplicationController.cpp
    src/core/database/Database.cpp
    src/core/models/ProductModel.cpp
    src/core/models/OrderModel.cpp
    src/core/models/PaymentModel.cpp
    src/core/services/OrderService.cpp
    src/core/services/PaymentService.cpp
    src/core/services/ProductService.cpp
)

set(HEADERS
    src/ApplicationController.h
    src/core/database/Database.h
    src/core/models/ProductModel.h
    src/core/models/OrderModel.h
    src/core/models/PaymentModel.h
    src/core/services/OrderService.h
    src/core/services/PaymentService.h
    src/core/services/ProductService.h
)

set(QML_FILES
    src/ui/main.qml
    src/ui/pages/MainPage.qml
    src/ui/components/TossHeader.qml
    src/ui/styles/TossTheme.qml
    src/ui/styles/Colors.qml
)

set(RESOURCES
    resources.qrc
)

# Create executable
add_executable(tossplace-clone
    ${SOURCES}
    ${HEADERS}
    ${QML_FILES}
    ${RESOURCES}
)

# Link Qt libraries
target_link_libraries(tossplace-clone
    Qt6::Core
    Qt6::Gui
    Qt6::Qml
    Qt6::Quick
    Qt6::Sql
    Qt6::Network
)

# Include directories
target_include_directories(tossplace-clone PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/src/core
)

# Windows specific settings
if(WIN32)
    set_target_properties(tossplace-clone PROPERTIES WIN32_EXECUTABLE ON)
endif()

# macOS specific settings
if(APPLE)
    set_target_properties(tossplace-clone PROPERTIES MACOSX_BUNDLE ON)
endif()

# Enable testing
enable_testing()
add_subdirectory(tests)
