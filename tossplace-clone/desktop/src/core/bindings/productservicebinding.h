#ifndef PRODUCTSERVICEBINDING_H
#define PRODUCTSERVICEBINDING_H

#include <QObject>
#include <QListModel>
#include <QList>
#include <QString>
#include "../services/productservice.h"

class ProductServiceBinding : public QObject {
    Q_OBJECT

public:
    explicit ProductServiceBinding(QObject *parent = nullptr);

    // Methods exposed to QML
    Q_INVOKABLE void loadAllProducts();
    Q_INVOKABLE void loadProductsByCategory(const QString& category);
    Q_INVOKABLE void loadProductsByRegion(const QString& region);
    Q_INVOKABLE void searchProducts(const QString& query);
    Q_INVOKABLE QVariantList getProductList() const;
    Q_INVOKABLE QVariantMap getProductById(int productId);

signals:
    void productsLoaded(const QVariantList& products);
    void loadFailed(const QString& message);

private:
    ProductService& productService = ProductService::getInstance();
    QList<Product> currentProducts;

    QVariantList productsToVariantList(const QList<Product>& products) const;
    QVariantMap productToVariantMap(const Product& product) const;
};

#endif // PRODUCTSERVICEBINDING_H
