#ifndef PRODUCTSERVICE_H
#define PRODUCTSERVICE_H

#include <QString>
#include <QList>
#include <memory>
#include "../models/product.h"

class ProductService {
public:
    static ProductService& getInstance();

    // Product query operations
    QList<Product> getAllProducts() const;
    QList<Product> getProductsByCategory(const QString& category) const;
    QList<Product> getProductsByRegion(const QString& region) const;
    QList<Product> searchProducts(const QString& query) const;
    Product getProductById(int productId) const;

    // Product management operations
    bool createProduct(const Product& product);
    bool updateProduct(const Product& product);
    bool deleteProduct(int productId);
    bool markAsSold(int productId);

    // Filter operations
    QList<Product> filterByPriceRange(double minPrice, double maxPrice) const;
    QList<Product> filterByCondition(const QString& condition) const;
    QList<Product> getSellerProducts(int sellerId) const;

private:
    ProductService();
    ~ProductService();

    // Copy and move prevention
    ProductService(const ProductService&) = delete;
    ProductService& operator=(const ProductService&) = delete;
    ProductService(ProductService&&) = delete;
    ProductService& operator=(ProductService&&) = delete;
};

#endif // PRODUCTSERVICE_H
