#include <QtTest>
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QStandardPaths>
#include "../src/core/database/database.h"

class TestDatabase : public QObject {
    Q_OBJECT

private slots:
    void initTestCase();
    void cleanupTestCase();

    void testDatabaseInitialization();
    void testTableCreation();
    void testDatabaseConnection();

private:
    QString testDbPath;
};

void TestDatabase::initTestCase() {
    testDbPath = QStandardPaths::writableLocation(QStandardPaths::TempLocation) + "/test_tossplace.db";
}

void TestDatabase::cleanupTestCase() {
    // Cleanup test database
}

void TestDatabase::testDatabaseInitialization() {
    Database& db = Database::getInstance();
    QVERIFY(db.initialize(testDbPath));
    QVERIFY(db.isConnected());
    db.close();
}

void TestDatabase::testTableCreation() {
    Database& db = Database::getInstance();
    db.initialize(testDbPath);
    QVERIFY(db.createTables());
    db.close();
}

void TestDatabase::testDatabaseConnection() {
    Database& db = Database::getInstance();
    db.initialize(testDbPath);
    QVERIFY(db.isConnected());
    db.close();
    QVERIFY(!db.isConnected());
}

QTEST_MAIN(TestDatabase)
#include "test_database.moc"
