-- Chỉ chạy khi muốn xóa bộ đơn mẫu đã thêm bởi scripts/seed-demo-orders.mjs.
-- order_items được xóa theo ON DELETE CASCADE; tồn kho thật không bị tác động.
BEGIN;
DELETE FROM public.orders
WHERE user_id='demo-orders-customer-v1'
  AND id LIKE 'demo-order-%'
  AND shipping_note='DEMO_ORDERS_V1: dữ liệu giả để xem thống kê';
DELETE FROM public.users u
WHERE u.id='demo-orders-customer-v1' AND u.email='demo-orders@example.invalid'
  AND NOT u.is_active AND u.firebase_uid IS NULL
  AND NOT EXISTS(SELECT 1 FROM public.orders o WHERE o.user_id=u.id);
COMMIT;
