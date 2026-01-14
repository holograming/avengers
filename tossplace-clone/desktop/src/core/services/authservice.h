#ifndef AUTHSERVICE_H
#define AUTHSERVICE_H

#include <QString>
#include <memory>
#include "../models/user.h"

class AuthService {
public:
    struct AuthResult {
        bool success;
        QString message;
        User user;
    };

    static AuthService& getInstance();

    // Authentication operations
    AuthResult registerUser(const QString& username, const QString& email,
                          const QString& password, const QString& fullName);
    AuthResult loginUser(const QString& email, const QString& password);
    bool logoutUser();

    // User operations
    bool isLoggedIn() const;
    User getCurrentUser() const;
    bool setCurrentUser(const User& user);

    // Password operations
    QString hashPassword(const QString& password) const;
    bool verifyPassword(const QString& password, const QString& hash) const;

    // Token operations
    QString generateToken(const User& user);
    bool validateToken(const QString& token);

private:
    AuthService();
    ~AuthService();

    // Copy and move prevention
    AuthService(const AuthService&) = delete;
    AuthService& operator=(const AuthService&) = delete;
    AuthService(AuthService&&) = delete;
    AuthService& operator=(AuthService&&) = delete;

    User currentUser;
    bool loggedIn = false;
};

#endif // AUTHSERVICE_H
