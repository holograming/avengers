#ifndef DATABASE_H
#define DATABASE_H

#include <QString>
#include <QSqlDatabase>
#include <memory>

class Database
{
public:
    Database();
    ~Database();

    bool initialize(const QString &dbPath = "");
    bool executeQuery(const QString &query);
    void close();

    QSqlDatabase& getDatabase();
    bool isOpen() const;

private:
    std::unique_ptr<QSqlDatabase> m_db;
    QString m_dbPath;

    bool createSchema();
    bool createTablesIfNotExist();
};

#endif // DATABASE_H
