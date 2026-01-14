#ifndef DATABASE_H
#define DATABASE_H

#include <QSqlDatabase>
#include <QSqlQuery>
#include <QSqlError>
#include <QString>
#include <memory>

class Database {
public:
    static Database& getInstance();

    // Initialization
    bool initialize(const QString& dbPath);
    bool isConnected() const;
    void close();

    // Query execution
    QSqlQuery executeQuery(const QString& query);
    bool executeUpdate(const QString& query);

    // Database operations
    bool createTables();
    bool clearDatabase();

private:
    Database();
    ~Database();

    // Copy and move prevention
    Database(const Database&) = delete;
    Database& operator=(const Database&) = delete;
    Database(Database&&) = delete;
    Database& operator=(Database&&) = delete;

    QSqlDatabase db;
    bool initialized;
};

#endif // DATABASE_H
