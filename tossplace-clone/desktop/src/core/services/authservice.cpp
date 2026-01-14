#include "authservice.h"
#include "../database/database.h"
#include <QCryptographicHash>
#include <QUuid>
#include <QDateTime>
#include <QSqlQuery>
#include <QSqlError>
#include <QVariant>

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

    Database& db = Database::getInstance();
    if (!db.isConnected()) {
        result.success = false;
        result.message = "Database connection failed";
        return result;
    }

    // Check if user already exists
    QSqlQuery checkQuery;
    checkQuery.prepare("SELECT id FROM users WHERE username = :username OR email = :email");
    checkQuery.addBindValue(username);
    checkQuery.addBindValue(email);

    if (!checkQuery.exec()) {
        result.success = false;
        result.message = "Database query failed";
        return result;
    }

    if (checkQuery.next()) {
        result.success = false;
        result.message = "User with this username or email already exists";
        return result;
    }

    // Hash password and insert user
    QString passwordHash = hashPassword(password);

    QSqlQuery insertQuery;
    insertQuery.prepare("INSERT INTO users (username, email, password_hash, full_name) "
                       "VALUES (:username, :email, :password_hash, :full_name)");
    insertQuery.addBindValue(username);
    insertQuery.addBindValue(email);
    insertQuery.addBindValue(passwordHash);
    insertQuery.addBindValue(fullName);

    if (!insertQuery.exec()) {
        result.success = false;
        result.message = "Failed to register user: " + insertQuery.lastError().text();
        return result;
    }

    int userId = insertQuery.lastInsertId().toInt();
    result.success = true;
    result.message = "Registration successful";
    result.user = User(userId, username, email, fullName);

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

    Database& db = Database::getInstance();
    if (!db.isConnected()) {
        result.success = false;
        result.message = "Database connection failed";
        return result;
    }

    // Query user by email
    QSqlQuery query;
    query.prepare("SELECT id, username, email, full_name, profile_image_url FROM users WHERE email = :email");
    query.addBindValue(email);

    if (!query.exec()) {
        result.success = false;
        result.message = "Database query failed";
        return result;
    }

    if (!query.next()) {
        result.success = false;
        result.message = "Invalid email or password";
        return result;
    }

    // Get password hash and verify
    QSqlQuery hashQuery;
    hashQuery.prepare("SELECT password_hash FROM users WHERE email = :email");
    hashQuery.addBindValue(email);

    if (!hashQuery.exec() || !hashQuery.next()) {
        result.success = false;
        result.message = "Invalid email or password";
        return result;
    }

    QString storedHash = hashQuery.value(0).toString();

    if (!verifyPassword(password, storedHash)) {
        result.success = false;
        result.message = "Invalid email or password";
        return result;
    }

    // Create user object with query results
    int userId = query.value(0).toInt();
    QString username = query.value(1).toString();
    QString userEmail = query.value(2).toString();
    QString fullName = query.value(3).toString();
    QString profileImageUrl = query.value(4).toString();

    User user(userId, username, userEmail, fullName, profileImageUrl);

    // Generate and store token
    QString token = generateToken(user);

    // Set current user
    setCurrentUser(user);

    result.success = true;
    result.message = "Login successful";
    result.user = user;

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
