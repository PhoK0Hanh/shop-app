// Kiểu dùng chung giữa REST API và giao diện; không chứa kết nối database.
export type OrderStatus = 'preparing' | 'shipping' | 'delivered' | 'cancelled';
export const orderStatusLabels: Record<OrderStatus, string> = {
  preparing: 'Đang chuẩn bị', shipping: 'Đang giao', delivered: 'Giao hàng thành công',
  cancelled: 'Đã hủy',
};
export interface OrderItem {
  id: string; productId: string; productName: string; color: string; size: string;
  unitPrice: number; quantity: number;
}
export interface Order {
  id: string; status: OrderStatus; total: number; createdAt: string; items: OrderItem[];
  shipping: ShippingInfo | null;
}

// Snapshot người nhận của từng đơn, độc lập với hồ sơ tài khoản.
export interface ShippingInfo {
  recipientName: string;
  phone: string;
  address: string;
  note: string;
}
