-- Chạy một lần nếu orders đã tồn tại; không xóa đơn hay cập nhật trạng thái hiện tại.
BEGIN;
ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('preparing', 'shipping', 'delivered', 'cancelled'));
COMMENT ON COLUMN public.orders.status IS 'preparing: đang chuẩn bị; shipping: đang giao; delivered: giao hàng thành công; cancelled: đã hủy';
COMMIT;
