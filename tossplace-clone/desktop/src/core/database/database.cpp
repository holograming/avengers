#include "database.h"
#include <QSqlDriver>
#include <QSqlError>
#include <QFile>
#include <QStandardPaths>
#include <QDebug>

Database& Database::getInstance() {
    static Database instance;
    return instance;
}

Database::Database() : initialized(false) {
}

Database::~Database() {
    close();
}

bool Database::initialize(const QString& dbPath) {
    if (initialized) {
        return true;
    }

    db = QSqlDatabase::addDatabase("QSQLITE");
    db.setDatabaseName(dbPath);

    if (!db.open()) {
        qDebug() << "Failed to open database:" << db.lastError().text();
        return false;
    }

    // Enable foreign keys
    QSqlQuery query;
    if (!query.exec("PRAGMA foreign_keys = ON")) {
        qDebug() << "Failed to enable foreign keys:" << query.lastError().text();
        return false;
    }

    initialized = true;
    qDebug() << "Database initialized successfully:" << dbPath;
    return true;
}

bool Database::isConnected() const {
    return db.isOpen() && initialized;
}

void Database::close() {
    if (db.isOpen()) {
        db.close();
    }
    initialized = false;
}

QSqlQuery Database::executeQuery(const QString& query) {
    QSqlQuery q;
    q.exec(query);
    return q;
}

bool Database::executeUpdate(const QString& query) {
    QSqlQuery q;
    return q.exec(query);
}

bool Database::createTables() {
    if (!isConnected()) {
        return false;
    }

    // Read schema from file
    QString schemaPath = ":/schemas/database.sql";
    QFile schemaFile(schemaPath);

    if (!schemaFile.open(QIODevice::ReadOnly | QIODevice::Text)) {
        qDebug() << "Failed to open schema file:" << schemaPath;
        return false;
    }

    QString schema = QString::fromUtf8(schemaFile.readAll());
    schemaFile.close();

    // Split by semicolon and execute each statement
    QStringList statements = schema.split(";");
    for (const QString& statement : statements) {
        QString trimmed = statement.trimmed();
        if (trimmed.isEmpty()) {
            continue;
        }

        QSqlQuery query;
        if (!query.exec(trimmed)) {
            qDebug() << "Failed to execute query:" << query.lastError().text();
            qDebug() << "Query:" << trimmed;
            return false;
        }
    }

    qDebug() << "Database tables created successfully";
    return true;
}

bool Database::clearDatabase() {
    if (!isConnected()) {
        return false;
    }

    QStringList tables = db.tables();
    for (const QString& table : tables) {
        QSqlQuery query;
        if (!query.exec("DELETE FROM " + table)) {
            qDebug() << "Failed to clear table:" << table;
            return false;
        }
    }

    return true;
}
