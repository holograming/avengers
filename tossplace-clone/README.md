# Tossplace Clone - Qt/QML Desktop Application

A Korean secondhand marketplace desktop application built with Qt6 and C++, featuring user authentication, product management, and a modern QML-based user interface.

## Overview

This project is a desktop clone of Tossplace (당근마켓-like service), providing core features for buying and selling secondhand items locally. Built with Qt6 framework for cross-platform compatibility.

## Features

### User Authentication
- User registration with validation
- Secure password hashing (SHA256)
- User login with session management
- Logout functionality
- Current user tracking

### Product Management
- Browse all available products
- Filter products by category (전자제품, 의류, 도서, 가구)
- Filter products by region
- Search products by title/description
- View product details (price, condition, seller info)
- Create/update/delete products (seller features)
- Mark products as sold
- Price range filtering

### User Interface
- Modern QML-based interface
- Three main screens: Login, Product List, Product Details
- Responsive layout for different screen sizes
- Real-time product updates

## Project Structure

```
tossplace-clone/
├── desktop/                              # Main desktop application
│   ├── src/
│   │   ├── main.cpp                     # Application entry point
│   │   ├── application.h/cpp             # Application initialization
│   │   ├── core/
│   │   │   ├── database/
│   │   │   │   ├── database.h/cpp       # SQLite database wrapper
│   │   │   ├── models/
│   │   │   │   ├── user.h               # User data model
│   │   │   │   ├── product.h/cpp        # Product data model
│   │   │   ├── services/
│   │   │   │   ├── authservice.h/cpp    # Authentication service
│   │   │   │   ├── productservice.h/cpp # Product management service
│   │   │   ├── bindings/
│   │   │   │   ├── authservicebinding.h/cpp      # QML bridge for auth
│   │   │   │   ├── productservicebinding.h/cpp   # QML bridge for products
│   │   ├── ui/
│   │   │   ├── main.qml                 # Main application window
│   │   │   ├── LoginScreen.qml          # User login screen
│   │   │   ├── ProductListScreen.qml    # Product listing screen
│   │   │   ├── ProductDetailScreen.qml  # Product details screen
│   ├── tests/
│   │   ├── test_database.cpp            # Database unit tests
│   │   ├── test_auth.cpp                # Authentication tests
│   │   ├── test_product.cpp             # Product service tests
│   │   ├── CMakeLists.txt               # Test build configuration
│   ├── CMakeLists.txt                   # Main build configuration
├── shared/
│   ├── schemas/
│   │   └── database.sql                 # Database schema definition
└── README.md
```

## Database Schema

### Users Table
- `id` (INTEGER PRIMARY KEY)
- `username` (TEXT UNIQUE)
- `email` (TEXT UNIQUE)
- `password_hash` (TEXT)
- `full_name` (TEXT)
- `profile_image_url` (TEXT)
- `bio` (TEXT)
- `phone` (TEXT)
- `address` (TEXT)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)
- `is_active` (BOOLEAN)

### Products Table
- `id` (INTEGER PRIMARY KEY)
- `seller_id` (INTEGER, FOREIGN KEY)
- `title` (TEXT)
- `description` (TEXT)
- `category` (TEXT)
- `price` (REAL)
- `original_price` (REAL)
- `discount_percent` (INTEGER)
- `thumbnail_image_url` (TEXT)
- `images_urls` (TEXT, JSON format)
- `condition` (TEXT: 'new', 'used', 'like-new')
- `quantity` (INTEGER)
- `view_count` (INTEGER)
- `like_count` (INTEGER)
- `region` (TEXT)
- `location_latitude` (REAL)
- `location_longitude` (REAL)
- `is_available` (BOOLEAN)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Product Reviews Table
- `id` (INTEGER PRIMARY KEY)
- `product_id` (INTEGER, FOREIGN KEY)
- `reviewer_id` (INTEGER, FOREIGN KEY)
- `rating` (INTEGER: 1-5)
- `comment` (TEXT)
- `created_at` (DATETIME)

## Requirements

### Build Requirements
- **C++ Standard**: C++17 or later
- **Build System**: CMake 3.16+
- **Compiler**: MSVC (Visual Studio 2022) or compatible C++17 compiler
- **Qt Framework**: Qt6 with the following modules:
  - Qt6::Core
  - Qt6::Gui
  - Qt6::Qml
  - Qt6::Quick
  - Qt6::Sql
  - Qt6::Network
  - Qt6::Test (for unit tests)

### Runtime Requirements
- Windows, macOS, or Linux
- SQLite3 (included with Qt)

## Building the Project

### 1. Install Qt6
Download and install Qt6 from [qt.io](https://www.qt.io/download)

### 2. Configure CMake
```bash
cd tossplace-clone/desktop
mkdir build
cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
```

### 3. Build the Application
```bash
cmake --build . --config Release
```

### 4. Build Tests (Optional)
Tests are built automatically with the main project.

## Running the Application

### After Build
```bash
./tossplace-desktop        # Linux/macOS
tossplace-desktop.exe      # Windows
```

The application will:
1. Initialize the SQLite database in the user's app data directory
2. Create necessary tables if they don't exist
3. Display the login screen

### Test Database
The application uses a local SQLite database stored in:
- **Windows**: `%APPDATA%\tossplace-desktop\tossplace.db`
- **Linux**: `~/.local/share/tossplace-desktop/tossplace.db`
- **macOS**: `~/Library/Application Support/tossplace-desktop/tossplace.db`

## Running Tests

```bash
cd build
ctest                      # Run all tests
./test_auth               # Run specific test
./test_database
./test_product
```

## Architecture

### Service Layer
The application follows a service-oriented architecture with clear separation of concerns:

- **Database Service**: Handles all database operations (SQLite)
- **Authentication Service**: Manages user registration, login, and password verification
- **Product Service**: Manages product CRUD operations and queries

### QML Bindings
C++ services are exposed to the QML UI layer through binding classes:
- `AuthServiceBinding`: Provides auth methods to QML
- `ProductServiceBinding`: Provides product methods to QML

### Data Models
- **User**: Represents user profile information
- **Product**: Represents product listing with all properties

## Usage Guide

### For Users

1. **Registration**
   - Click "회원가입" on the login screen
   - Enter username, email, password, and full name
   - Click register

2. **Login**
   - Enter email and password
   - Click "로그인"

3. **Browse Products**
   - Use category filters (전체, 전자제품, 의류, 도서, 가구)
   - Search by keywords
   - Click on a product to view details

4. **View Product Details**
   - See full product information
   - View seller profile
   - "찜하기" to like (placeholder)
   - "구매하기" to purchase (placeholder)

### For Developers

#### Adding New Features
1. Add database schema changes to `database.sql`
2. Update service interfaces
3. Implement service methods
4. Create QML bindings if exposing to UI
5. Update QML screens
6. Write unit tests

#### Adding New Screens
1. Create new `.qml` file in `src/ui/`
2. Add screen component to `main.qml`
3. Define navigation logic
4. Add any necessary C++ bindings

## Implementation Details

### Authentication Flow
1. User enters credentials on login screen
2. `AuthServiceBinding.login()` is called
3. `AuthService` verifies password against database hash
4. If successful, current user is stored in memory
5. Navigation proceeds to product list screen

### Product Loading Flow
1. Product List Screen loads on entry
2. `ProductServiceBinding.loadAllProducts()` is called
3. `ProductService` queries database
4. Results are converted to QVariantList
5. `productsLoaded()` signal updates QML model
6. Grid displays products dynamically

### Product Search Flow
1. User enters search query
2. `ProductServiceBinding.searchProducts()` is called
3. Database query filters by title/description
4. Results update product model
5. Grid refreshes with filtered products

## Security Considerations

- Passwords are hashed using SHA256 before database storage
- Input validation on email, username, password fields
- SQL injection protection through parameterized queries
- Foreign key constraints maintain referential integrity
- PRAGMA foreign_keys enabled in database

## Performance Optimization

- SQLite indexes on frequently queried columns (seller_id, category, region)
- Paginated product loading for large result sets
- Image URLs stored as strings (lazy loading capability)
- Service singleton pattern prevents multiple database connections

## Known Limitations & Future Enhancements

### Current Limitations
- Image upload not implemented (URLs only)
- Messaging system not implemented
- Review system not fully integrated
- Payment processing not implemented
- Real-time notifications not implemented

### Planned Enhancements
- User profile editing
- Product image gallery with upload
- User-to-user messaging
- Rating and review system
- Favorites/wishlist
- Order history
- Transaction management
- Location-based searching with maps
- Push notifications
- Mobile version

## Troubleshooting

### Build Issues
- **Qt6 not found**: Set `Qt6_DIR` environment variable to your Qt6 installation
- **MSVC compiler not found**: Install Visual Studio 2022 with C++ development tools
- **CMAKE not found**: Add CMake to PATH or use full path

### Runtime Issues
- **Database initialization fails**: Check app data directory permissions
- **Login fails**: Ensure database has been initialized with tables
- **Products not showing**: Check database connection and product entries

## Contributing

1. Follow C++17 standard
2. Maintain service/UI separation
3. Add tests for new features
4. Update documentation
5. Use meaningful commit messages

## License

[Your License Here]

## Contact & Support

For issues, questions, or feature requests, please refer to the project repository.

## Changelog

### Version 0.1.0 (Current)
- Initial implementation
- Core authentication system
- Basic product management
- QML UI with three main screens
- SQLite database integration
- Unit test framework

---

**Built with Qt6 and C++17**
**Last Updated: 2026-01-14**
