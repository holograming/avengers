#ifndef PRODUCT_H
#define PRODUCT_H

#include <QString>
#include <QDateTime>
#include <QStringList>

class Product {
public:
    Product() = default;
    Product(int id, const QString& title, double price, int sellerId);

    // Getters
    int getId() const { return id; }
    int getSellerId() const { return sellerId; }
    QString getTitle() const { return title; }
    QString getDescription() const { return description; }
    QString getCategory() const { return category; }
    double getPrice() const { return price; }
    double getOriginalPrice() const { return originalPrice; }
    int getDiscountPercent() const { return discountPercent; }
    QString getThumbnailImageUrl() const { return thumbnailImageUrl; }
    QStringList getImagesUrls() const;
    QString getCondition() const { return condition; }
    int getQuantity() const { return quantity; }
    int getViewCount() const { return viewCount; }
    int getLikeCount() const { return likeCount; }
    QString getRegion() const { return region; }
    double getLocationLatitude() const { return locationLatitude; }
    double getLocationLongitude() const { return locationLongitude; }
    bool isAvailable() const { return available; }
    QDateTime getCreatedAt() const { return createdAt; }
    QDateTime getUpdatedAt() const { return updatedAt; }

    // Setters
    void setId(int id_) { id = id_; }
    void setSellerId(int sellerId_) { sellerId = sellerId_; }
    void setTitle(const QString& title_) { title = title_; }
    void setDescription(const QString& description_) { description = description_; }
    void setCategory(const QString& category_) { category = category_; }
    void setPrice(double price_) { price = price_; }
    void setOriginalPrice(double price) { originalPrice = price; }
    void setDiscountPercent(int percent) { discountPercent = percent; }
    void setThumbnailImageUrl(const QString& url) { thumbnailImageUrl = url; }
    void setImagesUrls(const QStringList& urls);
    void setCondition(const QString& condition_) { condition = condition_; }
    void setQuantity(int quantity_) { quantity = quantity_; }
    void setViewCount(int count) { viewCount = count; }
    void setLikeCount(int count) { likeCount = count; }
    void setRegion(const QString& region_) { region = region_; }
    void setLocation(double latitude, double longitude) {
        locationLatitude = latitude;
        locationLongitude = longitude;
    }
    void setAvailable(bool available_) { available = available_; }

private:
    int id = -1;
    int sellerId = -1;
    QString title;
    QString description;
    QString category;
    double price = 0.0;
    double originalPrice = 0.0;
    int discountPercent = 0;
    QString thumbnailImageUrl;
    QString imagesUrls;  // JSON or comma-separated
    QString condition = "used";
    int quantity = 1;
    int viewCount = 0;
    int likeCount = 0;
    QString region;
    double locationLatitude = 0.0;
    double locationLongitude = 0.0;
    bool available = true;
    QDateTime createdAt;
    QDateTime updatedAt;
};

#endif // PRODUCT_H
