#ifndef ORDERSERVICE_H
#define ORDERSERVICE_H

#include <QString>
#include <QList>
#include <QObject>
#include "../models/OrderModel.h"

class OrderService : public QObject
{
    Q_OBJECT

public:
    explicit OrderService(OrderModel *orderModel, QObject *parent = nullptr);

    // Order operations
    Order createOrder(const QString &customerName, const QList<OrderItem> &items);
    bool completeOrder(int orderId);
    bool cancelOrder(int orderId);
    Order getOrder(int orderId);

    // Queries
    QList<Order> getTodayOrders();
    QList<Order> getPendingOrders();
    int getTotalOrdersCount();
    double getTodayRevenue();

    // Analytics
    QList<Order> getOrders(int limit = 10, int offset = 0);

signals:
    void orderCreated(const Order &order);
    void orderCompleted(int orderId);
    void orderCancelled(int orderId);
    void errorOccurred(const QString &message);

private:
    OrderModel *m_model;
};

#endif // ORDERSERVICE_H
