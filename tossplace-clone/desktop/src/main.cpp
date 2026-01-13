#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include "ApplicationController.h"

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

    // Initialize Application Controller
    ApplicationController controller;

    // Create QML Engine
    QQmlApplicationEngine engine;

    // Set application controller to QML context
    engine.rootContext()->setContextProperty("appController", &controller);

    // Load main QML
    const QUrl url(QStringLiteral("qrc:/main.qml"));
    engine.load(url);

    if (engine.rootObjects().isEmpty())
        return -1;

    return app.exec();
}
