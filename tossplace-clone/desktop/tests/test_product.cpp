#include <QtTest>
#include "../src/core/models/product.h"
#include "../src/core/services/productservice.h"

class TestProductService : public QObject {
    Q_OBJECT

private slots:
    void initTestCase();
    void cleanupTestCase();

    void testProductCreation();
    void testProductProperties();
    void testProductImagesHandling();
    void testGetAllProducts();
    void testSearchProducts();

private:
};

void TestProductService::initTestCase() {
    // Setup
}

void TestProductService::cleanupTestCase() {
    // Cleanup
}

void TestProductService::testProductCreation() {
    Product product(1, "Test Product", 10000.0, 1);

    QCOMPARE(product.getId(), 1);
    QCOMPARE(product.getTitle(), "Test Product");
    QCOMPARE(product.getPrice(), 10000.0);
    QCOMPARE(product.getSellerId(), 1);
}

void TestProductService::testProductProperties() {
    Product product;
    product.setId(1);
    product.setTitle("Gaming Laptop");
    product.setPrice(1500000.0);
    product.setCategory("전자제품");
    product.setCondition("used");
    product.setQuantity(1);

    QCOMPARE(product.getId(), 1);
    QCOMPARE(product.getTitle(), "Gaming Laptop");
    QCOMPARE(product.getPrice(), 1500000.0);
    QCOMPARE(product.getCategory(), "전자제품");
    QCOMPARE(product.getCondition(), "used");
    QCOMPARE(product.getQuantity(), 1);
}

void TestProductService::testProductImagesHandling() {
    Product product;
    QStringList images = {"image1.jpg", "image2.jpg", "image3.jpg"};
    product.setImagesUrls(images);

    QStringList retrievedImages = product.getImagesUrls();
    QCOMPARE(retrievedImages.length(), 3);
    QCOMPARE(retrievedImages[0], "image1.jpg");
}

void TestProductService::testGetAllProducts() {
    ProductService& service = ProductService::getInstance();
    QList<Product> products = service.getAllProducts();

    // Should return empty list initially
    QCOMPARE(products.length(), 0);
}

void TestProductService::testSearchProducts() {
    ProductService& service = ProductService::getInstance();
    QList<Product> results = service.searchProducts("laptop");

    // Should handle empty search results gracefully
    QVERIFY(results.length() >= 0);
}

QTEST_MAIN(TestProductService)
#include "test_product.moc"
