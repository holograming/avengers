#ifndef AUTHSERVICEBINDING_H
#define AUTHSERVICEBINDING_H

#include <QObject>
#include <QString>
#include "../services/authservice.h"

class AuthServiceBinding : public QObject {
    Q_OBJECT
    Q_PROPERTY(bool isLoggedIn READ getIsLoggedIn NOTIFY isLoggedInChanged)
    Q_PROPERTY(QString currentUsername READ getCurrentUsername NOTIFY currentUserChanged)

public:
    explicit AuthServiceBinding(QObject *parent = nullptr);

    // Properties
    bool getIsLoggedIn() const;
    QString getCurrentUsername() const;

    // Methods
    Q_INVOKABLE void login(const QString& email, const QString& password);
    Q_INVOKABLE void registerUser(const QString& username, const QString& email,
                                  const QString& password, const QString& fullName);
    Q_INVOKABLE void logout();

signals:
    void isLoggedInChanged();
    void currentUserChanged();
    void loginSuccess(const QString& username);
    void loginFailed(const QString& message);
    void registerSuccess();
    void registerFailed(const QString& message);

private:
    AuthService& authService = AuthService::getInstance();
};

#endif // AUTHSERVICEBINDING_H
