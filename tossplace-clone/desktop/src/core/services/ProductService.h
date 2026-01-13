#ifndef PRODUCTSERVICE_H
#define PRODUCTSERVICE_H

#include <QString>
#include <QList>
#include <QObject>
#include "../models/ProductModel.h"

class ProductService : public QObject
{
    Q_OBJECT

public:
    explicit ProductService(ProductModel *productModel, QObject *parent = nullptr);

    // Product operations
    bool addProduct(const Product &product);
    bool updateProduct(const Product &product);
    bool deleteProduct(int productId);
    Product getProduct(int productId);

    // Queries
    QList<Product> getAllProducts();
    QList<Product> getProductsByCategory(const QString &category);
    QList<QString> getCategories();
    int getProductCount();

    // Stock management
    bool updateStock(int productId, int quantity);
    bool decreaseStock(int productId, int quantity);
    QList<Product> getLowStockProducts(int threshold = 10);

    // Analytics
    QList<Product> getTopProducts(int limit = 10);

signals:
    void productAdded(const Product &product);
    void productUpdated(const Product &product);
    void productDeleted(int productId);
    void stockLow(int productId, int quantity);
    void errorOccurred(const QString &message);

private:
    ProductModel *m_model;
};

#endif // PRODUCTSERVICE_H
