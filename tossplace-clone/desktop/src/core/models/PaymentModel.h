#ifndef PAYMENTMODEL_H
#define PAYMENTMODEL_H

#include <QString>
#include <QDateTime>
#include <QList>
#include <QObject>

struct Payment
{
    int id;
    int orderId;
    QString transactionId;
    QString method;  // card, cash, mobile_wallet, etc.
    double amount;
    QString status;  // pending, completed, failed, refunded
    QDateTime transactionTime;
    QString cardLast4;  // for card payments
    QString receiptNumber;
    QString notes;
};

class PaymentModel : public QObject
{
    Q_OBJECT

public:
    explicit PaymentModel(QObject *parent = nullptr);

    // CRUD operations
    bool addPayment(const Payment &payment);
    bool updatePayment(const Payment &payment);
    Payment getPayment(int paymentId);
    QList<Payment> getPaymentsByOrderId(int orderId);
    QList<Payment> getAllPayments();

    // Business logic
    bool processPayment(const Payment &payment);
    bool refundPayment(int paymentId);
    double getTotalRevenue(const QDateTime &startDate, const QDateTime &endDate);
    QList<Payment> getPaymentsByMethod(const QString &method);

    // Mock gateway
    bool validatePayment(const Payment &payment);

signals:
    void paymentProcessed(const Payment &payment);
    void paymentFailed(int paymentId, const QString &reason);
    void paymentRefunded(int paymentId);

private:
    QList<Payment> m_payments;
};

#endif // PAYMENTMODEL_H
