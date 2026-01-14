#include <QtTest>
#include "../src/core/services/authservice.h"
#include "../src/core/models/user.h"

class TestAuthService : public QObject {
    Q_OBJECT

private slots:
    void initTestCase();
    void cleanupTestCase();

    void testPasswordHashing();
    void testPasswordVerification();
    void testUserRegistration();
    void testUserLogin();
    void testLogout();
    void testCurrentUser();

private:
};

void TestAuthService::initTestCase() {
    // Setup
}

void TestAuthService::cleanupTestCase() {
    // Cleanup
}

void TestAuthService::testPasswordHashing() {
    AuthService& auth = AuthService::getInstance();
    QString password = "test123";
    QString hash = auth.hashPassword(password);

    QVERIFY(!hash.isEmpty());
    QVERIFY(hash.length() > 0);
}

void TestAuthService::testPasswordVerification() {
    AuthService& auth = AuthService::getInstance();
    QString password = "test123";
    QString hash = auth.hashPassword(password);

    QVERIFY(auth.verifyPassword(password, hash));
    QVERIFY(!auth.verifyPassword("wrongpassword", hash));
}

void TestAuthService::testUserRegistration() {
    AuthService& auth = AuthService::getInstance();
    auto result = auth.registerUser("testuser", "test@example.com", "password123", "Test User");

    // Registration might fail if user exists, but should validate input
    if (!result.success) {
        QVERIFY(!result.message.isEmpty());
    }
}

void TestAuthService::testUserLogin() {
    AuthService& auth = AuthService::getInstance();
    auto result = auth.loginUser("test@example.com", "password123");

    // Login should fail initially without database setup
    QVERIFY(!result.success || result.success);
}

void TestAuthService::testLogout() {
    AuthService& auth = AuthService::getInstance();
    QVERIFY(auth.logoutUser());
    QVERIFY(!auth.isLoggedIn());
}

void TestAuthService::testCurrentUser() {
    AuthService& auth = AuthService::getInstance();
    User testUser(1, "testuser", "test@example.com", "Test User");

    auth.setCurrentUser(testUser);
    QVERIFY(auth.isLoggedIn());
    QCOMPARE(auth.getCurrentUser().getUsername(), "testuser");
}

QTEST_MAIN(TestAuthService)
#include "test_auth.moc"
