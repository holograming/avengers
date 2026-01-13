#ifndef PAYMENTSERVICE_H
#define PAYMENTSERVICE_H

#include <QString>
#include <QList>
#include <QObject>
#include "../models/PaymentModel.h"

class PaymentService : public QObject
{
    Q_OBJECT

public:
    explicit PaymentService(PaymentModel *paymentModel, QObject *parent = nullptr);

    // Payment operations
    bool processPayment(int orderId, double amount, const QString &method);
    bool refundPayment(int paymentId);
    Payment getPaymentByOrderId(int orderId);

    // Payment gateway (Mock)
    bool validateCardPayment(const QString &cardNumber, const QString &cvv);
    bool validateMobilePayment(const QString &phoneNumber);
    bool validateCashPayment(double amount);

    // Queries
    QList<Payment> getPaymentsByDate(const QDateTime &date);
    double getDailyRevenue();
    double getMonthlyRevenue();

    // Analytics
    QList<Payment> getPaymentsByMethod(const QString &method);

signals:
    void paymentProcessed(const Payment &payment);
    void paymentFailed(const QString &reason);
    void paymentRefunded(int paymentId);
    void errorOccurred(const QString &message);

private:
    PaymentModel *m_model;
    bool m_isConnected;
};

#endif // PAYMENTSERVICE_H
