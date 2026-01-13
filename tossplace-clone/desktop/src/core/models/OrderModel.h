#ifndef ORDERMODEL_H
#define ORDERMODEL_H

#include <QString>
#include <QDateTime>
#include <QList>
#include <QObject>

struct OrderItem
{
    int productId;
    QString productName;
    int quantity;
    double unitPrice;
    double totalPrice;
};

struct Order
{
    int id;
    QString orderNumber;
    QString customerName;
    QDateTime orderTime;
    QString status;  // pending, completed, cancelled
    QList<OrderItem> items;
    double totalAmount;
    QString paymentMethod;
    QString notes;
};

class OrderModel : public QObject
{
    Q_OBJECT

public:
    explicit OrderModel(QObject *parent = nullptr);

    // CRUD operations
    bool addOrder(const Order &order);
    bool updateOrder(const Order &order);
    bool cancelOrder(int orderId);
    Order getOrder(int orderId);
    QList<Order> getAllOrders();
    QList<Order> getOrdersByDateRange(const QDateTime &start, const QDateTime &end);
    QList<Order> getOrdersByStatus(const QString &status);

    // Business logic
    double calculateTotal(const QList<OrderItem> &items);
    QString generateOrderNumber();
    int getPendingOrderCount();

signals:
    void orderAdded(const Order &order);
    void orderStatusChanged(int orderId, const QString &newStatus);
    void orderCancelled(int orderId);

private:
    QList<Order> m_orders;
    int m_orderCounter;
};

#endif // ORDERMODEL_H
