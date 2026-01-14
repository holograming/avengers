# Tossplace Clone - Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    QML UI Layer                          │
│  (main.qml, LoginScreen, ProductListScreen, etc.)       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│              Service Binding Layer                        │
│  (AuthServiceBinding, ProductServiceBinding)             │
│  - Converts C++ objects to QVariant                       │
│  - Manages signal/slot connections                       │
│  - Thread-safe property access                           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│              Business Logic Layer                         │
│  (AuthService, ProductService)                           │
│  - User authentication & authorization                   │
│  - Product CRUD operations                               │
│  - Data validation                                       │
│  - Error handling                                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│              Data Model Layer                             │
│  (User, Product)                                         │
│  - Data structures                                       │
│  - Getters/Setters                                       │
│  - Data serialization                                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│           Persistence Layer (Database)                    │
│  (Database, SQLite)                                       │
│  - Query execution                                        │
│  - Transaction management                                │
│  - Connection pooling                                     │
│  - Schema management                                      │
└─────────────────────────────────────────────────────────┘
```

## Layer Descriptions

### 1. QML UI Layer
**Purpose**: User interface and user interaction

**Components**:
- `main.qml`: Main application window and screen loader
- `LoginScreen.qml`: User authentication interface
- `ProductListScreen.qml`: Product browsing and filtering
- `ProductDetailScreen.qml`: Product information display

**Responsibilities**:
- Render UI components
- Handle user input
- Display data from services
- Navigate between screens
- Emit user actions

**Technology**:
- Qt Quick (QML)
- Qt Quick Controls
- Qt Quick Layouts

### 2. Service Binding Layer
**Purpose**: Bridge between Qt/C++ services and QML

**Components**:
- `AuthServiceBinding`: Exposes authentication operations
- `ProductServiceBinding`: Exposes product operations

**Responsibilities**:
- Expose C++ objects as QML-accessible objects
- Convert C++ return types to QVariant
- Manage Qt signal/slot connections
- Handle threading and synchronization
- Provide property notifications

**Pattern**: Adapter/Bridge Pattern

**Example**:
```cpp
// C++ Service
AuthService& auth = AuthService::getInstance();
AuthResult result = auth.loginUser("user@example.com", "pass");

// QML Binding (Adapter)
void AuthServiceBinding::login(const QString& email, const QString& password) {
    AuthService::AuthResult result = authService.loginUser(email, password);
    if (result.success) {
        emit loginSuccess(result.user.getUsername());
    } else {
        emit loginFailed(result.message);
    }
}
```

### 3. Business Logic Layer
**Purpose**: Core application logic and business rules

**Components**:
- `AuthService`: Authentication and user management
  - User registration
  - Password verification
  - Session management
- `ProductService`: Product management
  - CRUD operations
  - Search and filtering
  - Inventory management

**Responsibilities**:
- Implement business rules
- Validate data
- Coordinate between layers
- Error handling
- Transaction management

**Pattern**: Singleton Pattern

```cpp
// Singleton access
AuthService& auth = AuthService::getInstance();
ProductService& products = ProductService::getInstance();
```

### 4. Data Model Layer
**Purpose**: Data structure definitions

**Components**:
- `User`: User profile information
- `Product`: Product listing information

**Responsibilities**:
- Define data structures
- Provide type-safe access
- Manage data validation
- Serialization/deserialization

**Example**:
```cpp
class User {
private:
    int id;
    QString username;
    QString email;
    QString fullName;

public:
    int getId() const { return id; }
    void setEmail(const QString& email_) { email = email_; }
};
```

### 5. Persistence Layer
**Purpose**: Database operations and schema management

**Components**:
- `Database`: SQLite wrapper and connection manager

**Responsibilities**:
- Database initialization
- Connection management
- Query execution
- Error handling
- Schema creation

**Database Technology**: SQLite3 (embedded)

## Data Flow Examples

### Authentication Flow
```
LoginScreen (QML)
    ↓
[User enters email/password]
    ↓
authService.login() [QML call]
    ↓
AuthServiceBinding::login() [C++ adapter]
    ↓
AuthService::loginUser() [Business logic]
    ↓
Database::executeQuery() [Execute SQL]
    ↓
[Verify password hash]
    ↓
emit loginSuccess() [Signal back to QML]
    ↓
ProductListScreen [Navigate on success]
```

### Product Loading Flow
```
ProductListScreen (QML)
    ↓
Component.onCompleted: productService.loadAllProducts()
    ↓
ProductServiceBinding::loadAllProducts() [C++ adapter]
    ↓
ProductService::getAllProducts() [Business logic]
    ↓
Database::executeQuery("SELECT ... FROM products")
    ↓
[Convert Product objects to QVariantList]
    ↓
emit productsLoaded(products) [Signal to QML]
    ↓
ListModel.append(products) [Update QML model]
    ↓
GridView displays products [UI update]
```

## Design Patterns Used

### 1. Singleton Pattern
**Purpose**: Ensure single instance of services

```cpp
AuthService& AuthService::getInstance() {
    static AuthService instance;
    return instance;
}
```

**Benefits**:
- Single point of access
- Global state management
- Resource efficiency

### 2. Adapter Pattern
**Purpose**: Bridge C++ and QML

```cpp
class AuthServiceBinding : public QObject {
    // Adapts C++ AuthService to QML
};
```

**Benefits**:
- Separation of concerns
- Type conversion
- Event handling

### 3. MVC Pattern (in QML)
**Purpose**: Separate model, view, controller

```qml
ListModel { id: productModel }  // Model
GridView { model: productModel } // View
Button { onClicked: ... }       // Controller
```

### 4. Factory Pattern
**Purpose**: Create database instances

```cpp
// Database uses factory internally for connection pooling
QSqlDatabase db = QSqlDatabase::addDatabase("QSQLITE");
```

## Threading Model

### Single-Threaded Application
- Main thread handles UI and all operations
- Database operations are synchronous
- QML runs on main thread

### Future Enhancements for Threading
```cpp
// For long-running operations:
QThread* workerThread = new QThread();
ServiceWorker* worker = new ServiceWorker();
worker->moveToThread(workerThread);
// ... connect signals/slots ...
workerThread->start();
```

## Memory Management

### Ownership Model
- **Application class**: Owns service bindings
- **QML Engine**: Owns Application
- **Services**: Singleton instances (no ownership transfer)
- **Models**: Created on stack or as member variables

### Resource Cleanup
```cpp
// Application destructor
Application::~Application() {
    db.close();  // Database closes on destruction
    // Service bindings auto-deleted as children of Application
}
```

## Error Handling Strategy

### Service Layer
```cpp
struct AuthResult {
    bool success;
    QString message;
    User user;
};
```

### QML Layer
```qml
Connections {
    target: authService
    function onLoginFailed(message) {
        errorText.text = message
        // User sees error message
    }
}
```

## Security Architecture

### Password Security
- SHA256 hashing algorithm
- No plaintext storage
- Verification without storing password

### Database Security
- SQL injection prevention via parameterized queries
- Foreign key constraints enabled
- User input validation

### Session Management
- Current user stored in memory during session
- Token generation for future enhancement
- Automatic logout on app close

## Performance Considerations

### Database Optimization
- Indexed columns: seller_id, category, region, username, email
- Lazy loading of images (URLs only)
- Efficient query design (single queries when possible)

### QML Optimization
- Component reuse
- Efficient data binding
- Minimal signal emissions

### Future Optimizations
- Database query caching
- Connection pooling
- Async/await operations
- Image thumbnail caching

## Extensibility

### Adding New Features
1. **New Screen**: Add .qml file, register in main.qml
2. **New Service**: Create service class, add binding
3. **New Database Table**: Update schema, extend Database class
4. **New Business Logic**: Add to appropriate service class

### Adding Authentication Methods
```cpp
// Current: Password-based
// Future: OAuth, LDAP, etc.
class AuthProvider {
    virtual AuthResult authenticate(...) = 0;
};
```

## Testing Architecture

### Unit Tests
- Database: Connection, table creation, basic queries
- Authentication: Password hashing, validation
- Product: CRUD operations, filtering

### Integration Tests
- User registration and login flow
- Product creation and retrieval
- Search and filtering operations

### Test Database
- Isolated SQLite database in temp location
- Cleaned up after each test
- Sample data creation for testing

## Deployment Architecture

### Build Output
- Single executable with Qt libraries
- Embedded SQLite database engine
- QML files compiled into application

### Installation
- Single-file installer
- Database created on first run
- User data directory: `~/.tossplace-desktop/`

### Platform Support
- Windows (MSVC)
- macOS (clang)
- Linux (GCC/clang)

## API Reference

### AuthService
```cpp
struct AuthResult {
    bool success;
    QString message;
    User user;
};

AuthResult registerUser(const QString& username, const QString& email,
                       const QString& password, const QString& fullName);
AuthResult loginUser(const QString& email, const QString& password);
bool logoutUser();
bool isLoggedIn() const;
User getCurrentUser() const;
QString hashPassword(const QString& password) const;
bool verifyPassword(const QString& password, const QString& hash) const;
```

### ProductService
```cpp
QList<Product> getAllProducts() const;
QList<Product> getProductsByCategory(const QString& category) const;
QList<Product> getProductsByRegion(const QString& region) const;
QList<Product> searchProducts(const QString& query) const;
Product getProductById(int productId) const;
bool createProduct(const Product& product);
bool updateProduct(const Product& product);
bool deleteProduct(int productId);
bool markAsSold(int productId);
QList<Product> filterByPriceRange(double minPrice, double maxPrice) const;
QList<Product> filterByCondition(const QString& condition) const;
QList<Product> getSellerProducts(int sellerId) const;
```

---

**Last Updated: 2026-01-14**
