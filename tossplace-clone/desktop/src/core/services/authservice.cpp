#include "authservice.h"
#include <QCryptographicHash>
#include <QUuid>
#include <QDateTime>

AuthService& AuthService::getInstance() {
    static AuthService instance;
    return instance;
}

AuthService::AuthService() {
}

AuthService::~AuthService() {
}

AuthService::AuthResult AuthService::registerUser(const QString& username,
                                                  const QString& email,
                                                  const QString& password,
                                                  const QString& fullName) {
    AuthResult result;

    // Validation
    if (username.isEmpty() || email.isEmpty() || password.isEmpty() || fullName.isEmpty()) {
        result.success = false;
        result.message = "All fields are required";
        return result;
    }

    if (password.length() < 6) {
        result.success = false;
        result.message = "Password must be at least 6 characters";
        return result;
    }

    // TODO: Check if user already exists in database
    // TODO: Insert user into database with hashed password

    result.success = true;
    result.message = "Registration successful";
    result.user = User(-1, username, email, fullName);

    return result;
}

AuthService::AuthResult AuthService::loginUser(const QString& email,
                                               const QString& password) {
    AuthResult result;

    if (email.isEmpty() || password.isEmpty()) {
        result.success = false;
        result.message = "Email and password are required";
        return result;
    }

    // TODO: Query database for user with this email
    // TODO: Verify password against stored hash
    // TODO: Create session token

    result.success = false;
    result.message = "Invalid email or password";

    return result;
}

bool AuthService::logoutUser() {
    currentUser = User();
    loggedIn = false;
    return true;
}

bool AuthService::isLoggedIn() const {
    return loggedIn;
}

User AuthService::getCurrentUser() const {
    return currentUser;
}

bool AuthService::setCurrentUser(const User& user) {
    currentUser = user;
    loggedIn = (user.getId() != -1);
    return true;
}

QString AuthService::hashPassword(const QString& password) const {
    QByteArray hash = QCryptographicHash::hash(
        password.toUtf8(),
        QCryptographicHash::Sha256
    );
    return QString(hash.toHex());
}

bool AuthService::verifyPassword(const QString& password, const QString& hash) const {
    QString calculatedHash = hashPassword(password);
    return calculatedHash == hash;
}

QString AuthService::generateToken(const User& user) {
    QString token = QUuid::createUuid().toString();
    // TODO: Store token with expiration
    return token;
}

bool AuthService::validateToken(const QString& token) {
    // TODO: Check token validity and expiration
    return !token.isEmpty();
}
