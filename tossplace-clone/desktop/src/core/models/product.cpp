#include "product.h"

Product::Product(int id, const QString& title, double price, int sellerId)
    : id(id), title(title), price(price), sellerId(sellerId) {
}

QStringList Product::getImagesUrls() const {
    return imagesUrls.split(",");
}

void Product::setImagesUrls(const QStringList& urls) {
    imagesUrls = urls.join(",");
}
