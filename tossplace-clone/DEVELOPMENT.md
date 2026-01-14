# Development Guide for Tossplace Clone

This guide is for developers who want to contribute to or extend the Tossplace Clone project.

## Getting Started with Development

### 1. Clone and Setup
```bash
git clone <repository-url>
cd tossplace-clone/desktop

# Install dependencies (see BUILDING.md)
# Then build the project
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Debug
cmake --build .
```

### 2. Project Structure Overview
```
desktop/
├── src/
│   ├── main.cpp              # Entry point
│   ├── application.h/cpp      # Application initialization
│   ├── core/
│   │   ├── database/          # Database layer
│   │   ├── models/            # Data structures
│   │   ├── services/          # Business logic
│   │   └── bindings/          # QML bridges
│   └── ui/                    # QML interface
├── tests/                     # Unit tests
└── CMakeLists.txt            # Build configuration
```

## Code Style and Standards

### C++ Code Style

**Naming Conventions:**
- Classes: PascalCase (e.g., `AuthService`)
- Methods: camelCase (e.g., `loginUser()`)
- Member variables: camelCase with underscore prefix (e.g., `_currentUser`)
- Constants: UPPER_CASE (e.g., `MAX_USERNAME_LENGTH`)
- Enum values: UPPER_CASE (e.g., `USER_NOT_FOUND`)

**Example:**
```cpp
class AuthService {
private:
    User _currentUser;
    const int MAX_PASSWORD_LENGTH = 255;

public:
    bool loginUser(const QString& email, const QString& password);
    void setCurrentUser(const User& user);
};
```

### Formatting Guidelines

- **Indentation**: 4 spaces (no tabs)
- **Line length**: Maximum 100 characters
- **Braces**: Allman style (opening brace on new line)
- **Includes**: System includes first, then project includes

```cpp
#include <QString>
#include <QList>

#include "authservice.h"
#include "models/user.h"

class AuthService {
    // Implementation
};
```

### Header Files

- Always use header guards or `#pragma once`
- Place function declarations before implementation
- Include necessary dependencies
- Comment public APIs

```cpp
#ifndef AUTHSERVICE_H
#define AUTHSERVICE_H

#include <QString>
#include "models/user.h"

class AuthService {
public:
    /// Authenticates user with email and password
    /// @param email User email address
    /// @param password User password
    /// @return AuthResult with success status and user data
    AuthResult loginUser(const QString& email, const QString& password);

private:
    User _currentUser;
};

#endif // AUTHSERVICE_H
```

## Adding New Features

### Adding a New Service

**1. Define the Model (if needed)**
```cpp
// src/core/models/messagemodel.h
class Message {
private:
    int _id;
    QString _content;
    // ...
public:
    Message(int id, const QString& content);
    int getId() const { return _id; }
    // ... getters and setters
};
```

**2. Create the Service**
```cpp
// src/core/services/messageservice.h
class MessageService {
public:
    static MessageService& getInstance();

    Message getMessageById(int id);
    QList<Message> getConversation(int userId1, int userId2);
    bool sendMessage(const Message& message);

private:
    MessageService();
    MessageService(const MessageService&) = delete;
    // ... implementation
};
```

**3. Implement Database Operations**
```cpp
// src/core/services/messageservice.cpp
Message MessageService::getMessageById(int id) {
    Database& db = Database::getInstance();

    QSqlQuery query;
    query.prepare("SELECT id, content, from_id, to_id FROM messages WHERE id = :id");
    query.addBindValue(id);

    if (!query.exec() || !query.next()) {
        return Message();
    }

    Message msg(query.value(0).toInt(), query.value(1).toString());
    return msg;
}
```

**4. Create QML Binding**
```cpp
// src/core/bindings/messageservicebinding.h
class MessageServiceBinding : public QObject {
    Q_OBJECT
public:
    explicit MessageServiceBinding(QObject *parent = nullptr);
    Q_INVOKABLE void sendMessage(const QString& to, const QString& content);
    Q_INVOKABLE QVariantList getConversation(int userId);

signals:
    void messageSent();
    void messageReceived(const QString& from, const QString& content);

private:
    MessageService& _messageService = MessageService::getInstance();
};
```

**5. Register Binding in Application**
```cpp
// src/application.cpp
bool Application::initializeServices() {
    auto authBinding = new AuthServiceBinding(this);
    auto messageBinding = new MessageServiceBinding(this);

    engine->rootContext()->setContextProperty("authService", authBinding);
    engine->rootContext()->setContextProperty("messageService", messageBinding);

    return true;
}
```

**6. Add QML UI**
```qml
// src/ui/ConversationScreen.qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    ListView {
        id: messageList
        model: messageModel

        delegate: Text {
            text: model.content
        }
    }

    TextField {
        id: input
        placeholderText: "Type message..."
    }

    Button {
        text: "Send"
        onClicked: {
            messageService.sendMessage(recipientId, input.text)
            input.clear()
        }
    }

    Connections {
        target: messageService
        function onMessageSent() {
            messageService.getConversation(currentUserId)
        }
    }
}
```

### Adding a New QML Screen

1. Create the QML file in `src/ui/`
2. Define signals for screen interaction
3. Add component to `main.qml` loader
4. Connect to services via bindings

### Modifying Database Schema

1. Update `shared/schemas/database.sql`
2. Add migration logic in `Database::createTables()`
3. Update affected service methods
4. Create unit tests for new operations
5. Update documentation

```sql
-- Add to shared/schemas/database.sql
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_id INTEGER NOT NULL,
    to_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_from_id ON messages(from_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_id ON messages(to_id);
```

## Writing Tests

### Unit Test Example
```cpp
// tests/test_message.cpp
#include <QtTest>
#include "../src/core/services/messageservice.h"

class TestMessageService : public QObject {
    Q_OBJECT

private slots:
    void initTestCase() {
        // Initialize test database
    }

    void testSendMessage() {
        MessageService& svc = MessageService::getInstance();
        Message msg(0, "Test message");

        bool result = svc.sendMessage(msg);
        QVERIFY(result);
    }

    void testGetMessage() {
        MessageService& svc = MessageService::getInstance();
        Message msg = svc.getMessageById(1);

        QVERIFY(msg.getId() > 0);
        QVERIFY(!msg.getContent().isEmpty());
    }
};

QTEST_MAIN(TestMessageService)
#include "test_message.moc"
```

### Running Tests
```bash
cd build
ctest                    # Run all tests
ctest -R test_message    # Run specific test
ctest -V                 # Verbose output
```

## Debugging

### Visual Studio Debugger
```
Debug → Start Debugging (F5)
Set breakpoints (Ctrl+B)
Step through code (F10, F11)
Watch variables (Debug → Windows → Watch)
```

### Qt Creator Debugger
```
Projects → Build & Run → Run configuration
Enable debugging option
Debug → Start Debugger (F5)
```

### QML Debugging
```qml
// Add debug output
console.log("Message:", message)
console.error("Error:", error)

// Use Qt.binding for complex properties
property var timestamp: Qt.binding(function() {
    return new Date().toString()
})
```

### Database Debugging
```cpp
// Enable SQL debugging
QSqlDatabase db = QSqlDatabase::database();
if (db.isOpen()) {
    qDebug() << "Executing:" << query.lastQuery();
    qDebug() << "Error:" << query.lastError().text();
}
```

## Performance Optimization

### Database Optimization
```cpp
// Use transactions for multiple operations
QSqlQuery query;
query.exec("BEGIN TRANSACTION");
for (const auto& product : products) {
    // Insert products
}
query.exec("COMMIT");
```

### QML Optimization
```qml
// Use ListView with delegate caching
ListView {
    cacheBuffer: 200  // Cache nearby items
    highlightMoveDuration: 0  // Instant selection
}

// Use asynchronous loading
Component.onCompleted: Qt.callLater(loadData)
```

### Memory Management
```cpp
// Use smart pointers
std::unique_ptr<Database> db(new Database());

// Avoid circular references in QML/C++
// Explicitly disconnect signals when deleting
```

## Code Review Checklist

Before submitting pull requests:

- [ ] Code follows style guidelines
- [ ] No compiler warnings
- [ ] All tests pass
- [ ] New code has tests
- [ ] Documentation is updated
- [ ] No memory leaks (use valgrind on Linux)
- [ ] Performance is acceptable
- [ ] Security best practices followed
- [ ] Commit messages are descriptive
- [ ] No hardcoded values/paths

## Common Issues and Solutions

### Issue: "Undefined reference" linker error
**Solution**: Check CMakeLists.txt includes all source files
```cmake
set(SOURCES
    src/main.cpp
    src/application.cpp
    # ... all files listed
)
```

### Issue: QML signals not connecting
**Solution**: Ensure Q_OBJECT macro is in class definition
```cpp
class AuthServiceBinding : public QObject {
    Q_OBJECT  // REQUIRED for signals/slots
public:
    // ...
};
```

### Issue: Database locked error
**Solution**: Close previous database instances or use transactions
```cpp
QSqlQuery query;
query.exec("BEGIN EXCLUSIVE TRANSACTION");
// Perform operations
query.exec("COMMIT");
```

### Issue: QML binding loop warning
**Solution**: Avoid circular bindings
```qml
// BAD: Creates binding loop
property int value: value + 1

// GOOD: Use computed binding
property int value
property int incrementedValue: value + 1
```

## Contributing Guidelines

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/your-feature`
3. **Make changes** following code standards
4. **Write tests** for new features
5. **Commit with descriptive messages**:
   ```
   feat: Add messaging system

   - Implement MessageService
   - Add QML UI for conversations
   - Add database schema
   - Write unit tests
   ```
6. **Push to your fork**: `git push origin feature/your-feature`
7. **Create Pull Request** with description of changes
8. **Address review comments**
9. **Merge when approved**

## Resources

- Qt6 Documentation: https://doc.qt.io/qt-6/
- SQLite Documentation: https://www.sqlite.org/docs.html
- C++ Reference: https://en.cppreference.com/
- QML Documentation: https://doc.qt.io/qt-6/qml-index.html
- CMake Documentation: https://cmake.org/documentation/

## Contact

For questions or clarifications, please:
1. Check existing documentation
2. Review similar code in the project
3. Open an issue in the repository
4. Reach out to project maintainers

---

**Happy coding! 🚀**

**Last Updated: 2026-01-14**
