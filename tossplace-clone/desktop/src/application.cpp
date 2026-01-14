#include "application.h"
#include "core/database/database.h"
#include "core/bindings/authservicebinding.h"
#include "core/bindings/productservicebinding.h"
#include <QQmlContext>
#include <QStandardPaths>
#include <QDir>

Application::Application(int& argc, char** argv)
    : QGuiApplication(argc, argv),
      engine(std::make_unique<QQmlApplicationEngine>()) {
}

Application::~Application() {
}

bool Application::initialize() {
    if (!initializeDatabase()) {
        return false;
    }

    if (!initializeServices()) {
        return false;
    }

    if (!initializeQmlEngine()) {
        return false;
    }

    return true;
}

bool Application::initializeDatabase() {
    // Get database path
    QString dbPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir().mkpath(dbPath);
    dbPath += "/tossplace.db";

    // Initialize database
    Database& db = Database::getInstance();
    if (!db.initialize(dbPath)) {
        return false;
    }

    if (!db.createTables()) {
        return false;
    }

    return true;
}

bool Application::initializeServices() {
    // Create service bindings
    auto authBinding = new AuthServiceBinding(this);
    auto productBinding = new ProductServiceBinding(this);

    // Register with QML engine
    engine->rootContext()->setContextProperty("authService", authBinding);
    engine->rootContext()->setContextProperty("productService", productBinding);

    return true;
}

bool Application::initializeQmlEngine() {
    // Set root context properties
    engine->rootContext()->setContextProperty("applicationVersion", "0.1.0");

    // Load main QML file
    const QUrl url(QStringLiteral("qrc:/ui/main.qml"));
    engine->load(url);

    if (engine->rootObjects().isEmpty()) {
        return false;
    }

    return true;
}

void Application::run() {
    // Main event loop already started by exec()
}
