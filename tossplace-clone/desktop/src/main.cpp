#include "application.h"

int main(int argc, char *argv[]) {
    Application app(argc, argv);

    if (!app.initialize()) {
        return 1;
    }

    app.run();
    return app.exec();
}
