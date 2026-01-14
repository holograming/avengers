find_package(Qt6 COMPONENTS Test REQUIRED)

# Test executables
set(TEST_SOURCES
    test_database.cpp
    test_auth.cpp
    test_product.cpp
)

foreach(TEST_SOURCE ${TEST_SOURCES})
    get_filename_component(TEST_NAME ${TEST_SOURCE} NAME_WE)
    add_executable(${TEST_NAME} ${TEST_SOURCE})

    target_link_libraries(${TEST_NAME}
        Qt6::Core
        Qt6::Sql
        Qt6::Test
    )

    target_include_directories(${TEST_NAME} PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/../src
    )

    add_test(NAME ${TEST_NAME} COMMAND ${TEST_NAME})
endforeach()
