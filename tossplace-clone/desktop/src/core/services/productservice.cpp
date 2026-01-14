#include "productservice.h"
#include "../database/database.h"
#include <QSqlQuery>
#include <QSqlError>
#include <QVariant>

ProductService& ProductService::getInstance() {
    static ProductService instance;
    return instance;
}

ProductService::ProductService() {
}

ProductService::~ProductService() {
}

QList<Product> ProductService::getAllProducts() const {
    QList<Product> products;
    Database& db = Database::getInstance();
    if (!db.isConnected()) {
        return products;
    }

    QSqlQuery query("SELECT id, seller_id, title, description, category, price, original_price, "
                    "discount_percent, thumbnail_image_url, condition, quantity, view_count, "
                    "like_count, region, location_latitude, location_longitude, is_available, "
                    "created_at, updated_at FROM products WHERE is_available = 1 "
                    "ORDER BY created_at DESC");

    while (query.next()) {
        Product product;
        product.setId(query.value(0).toInt());
        product.setSellerId(query.value(1).toInt());
        product.setTitle(query.value(2).toString());
        product.setDescription(query.value(3).toString());
        product.setCategory(query.value(4).toString());
        product.setPrice(query.value(5).toDouble());
        product.setOriginalPrice(query.value(6).toDouble());
        product.setDiscountPercent(query.value(7).toInt());
        product.setThumbnailImageUrl(query.value(8).toString());
        product.setCondition(query.value(9).toString());
        product.setQuantity(query.value(10).toInt());
        product.setViewCount(query.value(11).toInt());
        product.setLikeCount(query.value(12).toInt());
        product.setRegion(query.value(13).toString());
        product.setLocation(query.value(14).toDouble(), query.value(15).toDouble());
        product.setAvailable(query.value(16).toBool());

        products.append(product);
    }

    return products;
}

QList<Product> ProductService::getProductsByCategory(const QString& category) const {
    QList<Product> products;
    Database& db = Database::getInstance();
    if (!db.isConnected()) {
        return products;
    }

    QSqlQuery query;
    query.prepare("SELECT id, seller_id, title, description, category, price, original_price, "
                  "discount_percent, thumbnail_image_url, condition, quantity, view_count, "
                  "like_count, region, location_latitude, location_longitude, is_available, "
                  "created_at, updated_at FROM products WHERE category = :category AND is_available = 1 "
                  "ORDER BY created_at DESC");
    query.addBindValue(category);

    if (!query.exec()) {
        return products;
    }

    while (query.next()) {
        Product product;
        product.setId(query.value(0).toInt());
        product.setSellerId(query.value(1).toInt());
        product.setTitle(query.value(2).toString());
        product.setDescription(query.value(3).toString());
        product.setCategory(query.value(4).toString());
        product.setPrice(query.value(5).toDouble());
        product.setOriginalPrice(query.value(6).toDouble());
        product.setDiscountPercent(query.value(7).toInt());
        product.setThumbnailImageUrl(query.value(8).toString());
        product.setCondition(query.value(9).toString());
        product.setQuantity(query.value(10).toInt());
        product.setViewCount(query.value(11).toInt());
        product.setLikeCount(query.value(12).toInt());
        product.setRegion(query.value(13).toString());
        product.setLocation(query.value(14).toDouble(), query.value(15).toDouble());
        product.setAvailable(query.value(16).toBool());

        products.append(product);
    }

    return products;
}

QList<Product> ProductService::getProductsByRegion(const QString& region) const {
    QList<Product> products;
    Database& db = Database::getInstance();
    if (!db.isConnected()) {
        return products;
    }

    QSqlQuery query;
    query.prepare("SELECT id, seller_id, title, description, category, price, original_price, "
                  "discount_percent, thumbnail_image_url, condition, quantity, view_count, "
                  "like_count, region, location_latitude, location_longitude, is_available, "
                  "created_at, updated_at FROM products WHERE region = :region AND is_available = 1 "
                  "ORDER BY created_at DESC");
    query.addBindValue(region);

    if (!query.exec()) {
        return products;
    }

    while (query.next()) {
        Product product;
        product.setId(query.value(0).toInt());
        product.setSellerId(query.value(1).toInt());
        product.setTitle(query.value(2).toString());
        product.setDescription(query.value(3).toString());
        product.setCategory(query.value(4).toString());
        product.setPrice(query.value(5).toDouble());
        product.setOriginalPrice(query.value(6).toDouble());
        product.setDiscountPercent(query.value(7).toInt());
        product.setThumbnailImageUrl(query.value(8).toString());
        product.setCondition(query.value(9).toString());
        product.setQuantity(query.value(10).toInt());
        product.setViewCount(query.value(11).toInt());
        product.setLikeCount(query.value(12).toInt());
        product.setRegion(query.value(13).toString());
        product.setLocation(query.value(14).toDouble(), query.value(15).toDouble());
        product.setAvailable(query.value(16).toBool());

        products.append(product);
    }

    return products;
}

QList<Product> ProductService::searchProducts(const QString& searchQuery) const {
    QList<Product> products;
    Database& db = Database::getInstance();
    if (!db.isConnected()) {
        return products;
    }

    QSqlQuery query;
    query.prepare("SELECT id, seller_id, title, description, category, price, original_price, "
                  "discount_percent, thumbnail_image_url, condition, quantity, view_count, "
                  "like_count, region, location_latitude, location_longitude, is_available, "
                  "created_at, updated_at FROM products "
                  "WHERE (title LIKE :query OR description LIKE :query) AND is_available = 1 "
                  "ORDER BY created_at DESC");
    QString searchPattern = "%" + searchQuery + "%";
    query.addBindValue(searchPattern);
    query.addBindValue(searchPattern);

    if (!query.exec()) {
        return products;
    }

    while (query.next()) {
        Product product;
        product.setId(query.value(0).toInt());
        product.setSellerId(query.value(1).toInt());
        product.setTitle(query.value(2).toString());
        product.setDescription(query.value(3).toString());
        product.setCategory(query.value(4).toString());
        product.setPrice(query.value(5).toDouble());
        product.setOriginalPrice(query.value(6).toDouble());
        product.setDiscountPercent(query.value(7).toInt());
        product.setThumbnailImageUrl(query.value(8).toString());
        product.setCondition(query.value(9).toString());
        product.setQuantity(query.value(10).toInt());
        product.setViewCount(query.value(11).toInt());
        product.setLikeCount(query.value(12).toInt());
        product.setRegion(query.value(13).toString());
        product.setLocation(query.value(14).toDouble(), query.value(15).toDouble());
        product.setAvailable(query.value(16).toBool());

        products.append(product);
    }

    return products;
}

Product ProductService::getProductById(int productId) const {
    Product product;
    Database& db = Database::getInstance();
    if (!db.isConnected()) {
        return product;
    }

    QSqlQuery query;
    query.prepare("SELECT id, seller_id, title, description, category, price, original_price, "
                  "discount_percent, thumbnail_image_url, condition, quantity, view_count, "
                  "like_count, region, location_latitude, location_longitude, is_available, "
                  "created_at, updated_at FROM products WHERE id = :id");
    query.addBindValue(productId);

    if (!query.exec() || !query.next()) {
        return product;
    }

    product.setId(query.value(0).toInt());
    product.setSellerId(query.value(1).toInt());
    product.setTitle(query.value(2).toString());
    product.setDescription(query.value(3).toString());
    product.setCategory(query.value(4).toString());
    product.setPrice(query.value(5).toDouble());
    product.setOriginalPrice(query.value(6).toDouble());
    product.setDiscountPercent(query.value(7).toInt());
    product.setThumbnailImageUrl(query.value(8).toString());
    product.setCondition(query.value(9).toString());
    product.setQuantity(query.value(10).toInt());
    product.setViewCount(query.value(11).toInt());
    product.setLikeCount(query.value(12).toInt());
    product.setRegion(query.value(13).toString());
    product.setLocation(query.value(14).toDouble(), query.value(15).toDouble());
    product.setAvailable(query.value(16).toBool());

    return product;
}

bool ProductService::createProduct(const Product& product) {
    Database& db = Database::getInstance();
    if (!db.isConnected()) {
        return false;
    }

    QSqlQuery query;
    query.prepare("INSERT INTO products (seller_id, title, description, category, price, "
                  "original_price, discount_percent, thumbnail_image_url, condition, quantity, "
                  "region, location_latitude, location_longitude, is_available) "
                  "VALUES (:seller_id, :title, :description, :category, :price, "
                  ":original_price, :discount_percent, :thumbnail_image_url, :condition, "
                  ":quantity, :region, :latitude, :longitude, :is_available)");

    query.addBindValue(product.getSellerId());
    query.addBindValue(product.getTitle());
    query.addBindValue(product.getDescription());
    query.addBindValue(product.getCategory());
    query.addBindValue(product.getPrice());
    query.addBindValue(product.getOriginalPrice());
    query.addBindValue(product.getDiscountPercent());
    query.addBindValue(product.getThumbnailImageUrl());
    query.addBindValue(product.getCondition());
    query.addBindValue(product.getQuantity());
    query.addBindValue(product.getRegion());
    query.addBindValue(product.getLocationLatitude());
    query.addBindValue(product.getLocationLongitude());
    query.addBindValue(product.isAvailable() ? 1 : 0);

    return query.exec();
}

bool ProductService::updateProduct(const Product& product) {
    Database& db = Database::getInstance();
    if (!db.isConnected()) {
        return false;
    }

    QSqlQuery query;
    query.prepare("UPDATE products SET title = :title, description = :description, "
                  "category = :category, price = :price, original_price = :original_price, "
                  "discount_percent = :discount_percent, thumbnail_image_url = :thumbnail_image_url, "
                  "condition = :condition, quantity = :quantity, region = :region, "
                  "location_latitude = :latitude, location_longitude = :longitude, "
                  "is_available = :is_available, updated_at = CURRENT_TIMESTAMP "
                  "WHERE id = :id");

    query.addBindValue(product.getTitle());
    query.addBindValue(product.getDescription());
    query.addBindValue(product.getCategory());
    query.addBindValue(product.getPrice());
    query.addBindValue(product.getOriginalPrice());
    query.addBindValue(product.getDiscountPercent());
    query.addBindValue(product.getThumbnailImageUrl());
    query.addBindValue(product.getCondition());
    query.addBindValue(product.getQuantity());
    query.addBindValue(product.getRegion());
    query.addBindValue(product.getLocationLatitude());
    query.addBindValue(product.getLocationLongitude());
    query.addBindValue(product.isAvailable() ? 1 : 0);
    query.addBindValue(product.getId());

    return query.exec();
}

bool ProductService::deleteProduct(int productId) {
    Database& db = Database::getInstance();
    if (!db.isConnected()) {
        return false;
    }

    QSqlQuery query;
    query.prepare("DELETE FROM products WHERE id = :id");
    query.addBindValue(productId);

    return query.exec();
}

bool ProductService::markAsSold(int productId) {
    Database& db = Database::getInstance();
    if (!db.isConnected()) {
        return false;
    }

    QSqlQuery query;
    query.prepare("UPDATE products SET is_available = 0, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
    query.addBindValue(productId);

    return query.exec();
}

QList<Product> ProductService::filterByPriceRange(double minPrice, double maxPrice) const {
    QList<Product> products;
    Database& db = Database::getInstance();
    if (!db.isConnected()) {
        return products;
    }

    QSqlQuery query;
    query.prepare("SELECT id, seller_id, title, description, category, price, original_price, "
                  "discount_percent, thumbnail_image_url, condition, quantity, view_count, "
                  "like_count, region, location_latitude, location_longitude, is_available, "
                  "created_at, updated_at FROM products "
                  "WHERE price >= :minPrice AND price <= :maxPrice AND is_available = 1 "
                  "ORDER BY price ASC");
    query.addBindValue(minPrice);
    query.addBindValue(maxPrice);

    if (!query.exec()) {
        return products;
    }

    while (query.next()) {
        Product product;
        product.setId(query.value(0).toInt());
        product.setSellerId(query.value(1).toInt());
        product.setTitle(query.value(2).toString());
        product.setDescription(query.value(3).toString());
        product.setCategory(query.value(4).toString());
        product.setPrice(query.value(5).toDouble());
        product.setOriginalPrice(query.value(6).toDouble());
        product.setDiscountPercent(query.value(7).toInt());
        product.setThumbnailImageUrl(query.value(8).toString());
        product.setCondition(query.value(9).toString());
        product.setQuantity(query.value(10).toInt());
        product.setViewCount(query.value(11).toInt());
        product.setLikeCount(query.value(12).toInt());
        product.setRegion(query.value(13).toString());
        product.setLocation(query.value(14).toDouble(), query.value(15).toDouble());
        product.setAvailable(query.value(16).toBool());

        products.append(product);
    }

    return products;
}

QList<Product> ProductService::filterByCondition(const QString& condition) const {
    QList<Product> products;
    Database& db = Database::getInstance();
    if (!db.isConnected()) {
        return products;
    }

    QSqlQuery query;
    query.prepare("SELECT id, seller_id, title, description, category, price, original_price, "
                  "discount_percent, thumbnail_image_url, condition, quantity, view_count, "
                  "like_count, region, location_latitude, location_longitude, is_available, "
                  "created_at, updated_at FROM products "
                  "WHERE condition = :condition AND is_available = 1 "
                  "ORDER BY created_at DESC");
    query.addBindValue(condition);

    if (!query.exec()) {
        return products;
    }

    while (query.next()) {
        Product product;
        product.setId(query.value(0).toInt());
        product.setSellerId(query.value(1).toInt());
        product.setTitle(query.value(2).toString());
        product.setDescription(query.value(3).toString());
        product.setCategory(query.value(4).toString());
        product.setPrice(query.value(5).toDouble());
        product.setOriginalPrice(query.value(6).toDouble());
        product.setDiscountPercent(query.value(7).toInt());
        product.setThumbnailImageUrl(query.value(8).toString());
        product.setCondition(query.value(9).toString());
        product.setQuantity(query.value(10).toInt());
        product.setViewCount(query.value(11).toInt());
        product.setLikeCount(query.value(12).toInt());
        product.setRegion(query.value(13).toString());
        product.setLocation(query.value(14).toDouble(), query.value(15).toDouble());
        product.setAvailable(query.value(16).toBool());

        products.append(product);
    }

    return products;
}

QList<Product> ProductService::getSellerProducts(int sellerId) const {
    QList<Product> products;
    Database& db = Database::getInstance();
    if (!db.isConnected()) {
        return products;
    }

    QSqlQuery query;
    query.prepare("SELECT id, seller_id, title, description, category, price, original_price, "
                  "discount_percent, thumbnail_image_url, condition, quantity, view_count, "
                  "like_count, region, location_latitude, location_longitude, is_available, "
                  "created_at, updated_at FROM products "
                  "WHERE seller_id = :seller_id "
                  "ORDER BY created_at DESC");
    query.addBindValue(sellerId);

    if (!query.exec()) {
        return products;
    }

    while (query.next()) {
        Product product;
        product.setId(query.value(0).toInt());
        product.setSellerId(query.value(1).toInt());
        product.setTitle(query.value(2).toString());
        product.setDescription(query.value(3).toString());
        product.setCategory(query.value(4).toString());
        product.setPrice(query.value(5).toDouble());
        product.setOriginalPrice(query.value(6).toDouble());
        product.setDiscountPercent(query.value(7).toInt());
        product.setThumbnailImageUrl(query.value(8).toString());
        product.setCondition(query.value(9).toString());
        product.setQuantity(query.value(10).toInt());
        product.setViewCount(query.value(11).toInt());
        product.setLikeCount(query.value(12).toInt());
        product.setRegion(query.value(13).toString());
        product.setLocation(query.value(14).toDouble(), query.value(15).toDouble());
        product.setAvailable(query.value(16).toBool());

        products.append(product);
    }

    return products;
}
