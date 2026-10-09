import AdminOverview from '@/components/admin/AdminOverview';
export const metadata = { title: 'Tổng quan | SHOP.CO' };

// Admin đăng nhập vào tổng quan; danh sách sản phẩm chuyển sang /admin/products.
export default function AdminPage() {
  return <AdminOverview />;
}
