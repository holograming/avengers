#ifndef APPLICATIONCONTROLLER_H
#define APPLICATIONCONTROLLER_H

#include <QObject>
#include <memory>
#include "core/database/Database.h"
#include "core/services/OrderService.h"
#include "core/services/PaymentService.h"
#include "core/services/ProductService.h"

class ApplicationController : public QObject
{
    Q_OBJECT

public:
    explicit ApplicationController(QObject *parent = nullptr);
    ~ApplicationController();

    // Initialize application
    Q_INVOKABLE void initialize();

    // Get services
    OrderService* getOrderService();
    PaymentService* getPaymentService();
    ProductService* getProductService();

signals:
    void initialized();
    void errorOccurred(const QString &message);

private:
    std::unique_ptr<Database> m_database;
    std::unique_ptr<OrderService> m_orderService;
    std::unique_ptr<PaymentService> m_paymentService;
    std::unique_ptr<ProductService> m_productService;

    bool initializeDatabase();
};

#endif // APPLICATIONCONTROLLER_H
