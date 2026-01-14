#ifndef USER_H
#define USER_H

#include <QString>
#include <QDateTime>

class User {
public:
    User() = default;
    User(int id, const QString& username, const QString& email,
          const QString& fullName, const QString& profileImageUrl = "");

    // Getters
    int getId() const { return id; }
    QString getUsername() const { return username; }
    QString getEmail() const { return email; }
    QString getFullName() const { return fullName; }
    QString getProfileImageUrl() const { return profileImageUrl; }
    QString getBio() const { return bio; }
    QString getPhone() const { return phone; }
    QString getAddress() const { return address; }
    QDateTime getCreatedAt() const { return createdAt; }
    QDateTime getUpdatedAt() const { return updatedAt; }
    bool isActive() const { return active; }

    // Setters
    void setId(int id_) { id = id_; }
    void setUsername(const QString& username_) { username = username_; }
    void setEmail(const QString& email_) { email = email_; }
    void setFullName(const QString& fullName_) { fullName = fullName_; }
    void setProfileImageUrl(const QString& url) { profileImageUrl = url; }
    void setBio(const QString& bio_) { bio = bio_; }
    void setPhone(const QString& phone_) { phone = phone_; }
    void setAddress(const QString& address_) { address = address_; }
    void setActive(bool active_) { active = active_; }

private:
    int id = -1;
    QString username;
    QString email;
    QString fullName;
    QString profileImageUrl;
    QString bio;
    QString phone;
    QString address;
    QDateTime createdAt;
    QDateTime updatedAt;
    bool active = true;
};

#endif // USER_H
