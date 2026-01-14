#include "authservicebinding.h"

AuthServiceBinding::AuthServiceBinding(QObject *parent)
    : QObject(parent) {
}

bool AuthServiceBinding::getIsLoggedIn() const {
    return authService.isLoggedIn();
}

QString AuthServiceBinding::getCurrentUsername() const {
    return authService.getCurrentUser().getUsername();
}

void AuthServiceBinding::login(const QString& email, const QString& password) {
    AuthService::AuthResult result = authService.loginUser(email, password);

    if (result.success) {
        emit loginSuccess(result.user.getUsername());
        emit isLoggedInChanged();
        emit currentUserChanged();
    } else {
        emit loginFailed(result.message);
    }
}

void AuthServiceBinding::registerUser(const QString& username, const QString& email,
                                      const QString& password, const QString& fullName) {
    AuthService::AuthResult result = authService.registerUser(username, email, password, fullName);

    if (result.success) {
        emit registerSuccess();
    } else {
        emit registerFailed(result.message);
    }
}

void AuthServiceBinding::logout() {
    authService.logoutUser();
    emit isLoggedInChanged();
    emit currentUserChanged();
}
