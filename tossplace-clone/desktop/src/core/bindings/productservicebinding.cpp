#include "productservicebinding.h"

ProductServiceBinding::ProductServiceBinding(QObject *parent)
    : QObject(parent) {
}

void ProductServiceBinding::loadAllProducts() {
    currentProducts = productService.getAllProducts();
    QVariantList productList = productsToVariantList(currentProducts);
    emit productsLoaded(productList);
}

void ProductServiceBinding::loadProductsByCategory(const QString& category) {
    currentProducts = productService.getProductsByCategory(category);
    QVariantList productList = productsToVariantList(currentProducts);
    emit productsLoaded(productList);
}

void ProductServiceBinding::loadProductsByRegion(const QString& region) {
    currentProducts = productService.getProductsByRegion(region);
    QVariantList productList = productsToVariantList(currentProducts);
    emit productsLoaded(productList);
}

void ProductServiceBinding::searchProducts(const QString& query) {
    currentProducts = productService.searchProducts(query);
    QVariantList productList = productsToVariantList(currentProducts);
    emit productsLoaded(productList);
}

QVariantList ProductServiceBinding::getProductList() const {
    return productsToVariantList(currentProducts);
}

QVariantMap ProductServiceBinding::getProductById(int productId) {
    Product product = productService.getProductById(productId);
    return productToVariantMap(product);
}

QVariantList ProductServiceBinding::productsToVariantList(const QList<Product>& products) const {
    QVariantList list;
    for (const auto& product : products) {
        list.append(productToVariantMap(product));
    }
    return list;
}

QVariantMap ProductServiceBinding::productToVariantMap(const Product& product) const {
    QVariantMap map;
    map["id"] = product.getId();
    map["title"] = product.getTitle();
    map["description"] = product.getDescription();
    map["category"] = product.getCategory();
    map["price"] = product.getPrice();
    map["originalPrice"] = product.getOriginalPrice();
    map["discountPercent"] = product.getDiscountPercent();
    map["thumbnailImageUrl"] = product.getThumbnailImageUrl();
    map["condition"] = product.getCondition();
    map["quantity"] = product.getQuantity();
    map["viewCount"] = product.getViewCount();
    map["likeCount"] = product.getLikeCount();
    map["region"] = product.getRegion();
    map["latitude"] = product.getLocationLatitude();
    map["longitude"] = product.getLocationLongitude();
    map["available"] = product.isAvailable();
    map["sellerId"] = product.getSellerId();
    return map;
}
