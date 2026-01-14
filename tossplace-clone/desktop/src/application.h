#ifndef APPLICATION_H
#define APPLICATION_H

#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <memory>

class Application : public QGuiApplication {
    Q_OBJECT

public:
    Application(int& argc, char** argv);
    ~Application();

    bool initialize();
    void run();

private:
    std::unique_ptr<QQmlApplicationEngine> engine;

    bool initializeDatabase();
    bool initializeServices();
    bool initializeQmlEngine();
};

#endif // APPLICATION_H
