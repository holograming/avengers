#ifndef PRODUCTMODEL_H
#define PRODUCTMODEL_H

#include <QString>
#include <QList>
#include <QObject>

struct Product
{
    int id;
    QString name;
    QString category;
    double price;
    int quantity;
    QString description;
    bool available;
};

class ProductModel : public QObject
{
    Q_OBJECT

public:
    explicit ProductModel(QObject *parent = nullptr);

    // CRUD operations
    bool addProduct(const Product &product);
    bool updateProduct(const Product &product);
    bool deleteProduct(int productId);
    Product getProduct(int productId);
    QList<Product> getAllProducts();
    QList<Product> getProductsByCategory(const QString &category);

    // Business logic
    bool decreaseStock(int productId, int quantity);
    bool increaseStock(int productId, int quantity);
    QList<QString> getCategories();

signals:
    void productAdded(const Product &product);
    void productUpdated(const Product &product);
    void productDeleted(int productId);
    void stockChanged(int productId, int newQuantity);

private:
    QList<Product> m_products;
};

#endif // PRODUCTMODEL_H
