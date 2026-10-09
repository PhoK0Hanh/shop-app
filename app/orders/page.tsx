import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/firebase/session';
import OrdersContent from '@/components/orders/OrdersContent';

export const metadata = { title: 'Đơn hàng của tôi | SHOP.CO' };
export default async function OrdersPage() {
  // Kiểm tra session server trước khi hiển thị trang lịch sử riêng của tài khoản.
  if (!await getSessionUser()) redirect('/login?next=%2Forders');
  return <div className="mx-auto max-w-7xl px-4 py-8">
    <h1 className="mb-8 text-3xl font-bold">Đơn hàng của tôi</h1>
    <OrdersContent />
  </div>;
}
