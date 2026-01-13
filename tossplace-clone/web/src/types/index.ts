/**
 * Tossplace Web - TypeScript Types
 * 공유 타입 정의
 */

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string;
  available: boolean;
  imageUrl?: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  orderTime: Date;
  status: 'pending' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  notes?: string;
}

export interface Payment {
  id: number;
  orderId: number;
  transactionId: string;
  method: 'card' | 'cash' | 'mobile_wallet' | 'online';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionTime: Date;
  cardLast4?: string;
  receiptNumber: string;
  notes?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  registeredDate: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Store {
  id: number;
  name: string;
  address: string;
  phone: string;
  operatingHours: string;
  cashierCount: number;
  revenue: number;
}
