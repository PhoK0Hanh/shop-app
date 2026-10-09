-- Chạy trong database shop_app sau khi đã có users và catalog.
BEGIN;
CREATE TABLE public.orders (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    request_id uuid NOT NULL,
    request_hash text NOT NULL,
    status text NOT NULL DEFAULT 'preparing'
        CONSTRAINT orders_status_check CHECK (status IN ('preparing', 'shipping', 'delivered', 'cancelled')),
    total bigint NOT NULL CHECK (total >= 0),
    -- NULL chỉ dành cho đơn cũ; API yêu cầu người nhận cho tất cả đơn mới.
    shipping_name text,
    shipping_phone text,
    shipping_address text,
    shipping_note text,
    CONSTRAINT orders_shipping_valid CHECK (
        (shipping_name IS NULL AND shipping_phone IS NULL AND shipping_address IS NULL AND shipping_note IS NULL)
        OR (shipping_name IS NOT NULL AND shipping_phone IS NOT NULL AND shipping_address IS NOT NULL
            AND length(trim(shipping_name)) BETWEEN 2 AND 100
            AND shipping_phone ~ '^0[0-9]{9}$'
            AND length(trim(shipping_address)) BETWEEN 10 AND 500
            AND length(COALESCE(shipping_note, '')) <= 1000)
    ),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, request_id)
);
CREATE TABLE public.order_items (
    id text PRIMARY KEY,
    order_id text NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    variant_id text REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_id text NOT NULL,
    product_name text NOT NULL,
    color text NOT NULL,
    size text NOT NULL,
    unit_price integer NOT NULL CHECK (unit_price >= 0),
    quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 999)
);
CREATE INDEX orders_user_created_idx ON public.orders(user_id, created_at DESC, id);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
-- Snapshot giữ lịch sử sản phẩm; trạng thái chỉ được đổi bởi backend/admin sau này.
COMMENT ON COLUMN public.orders.status IS 'preparing: đang chuẩn bị; shipping: đang giao; delivered: giao hàng thành công; cancelled: đã hủy';
COMMENT ON COLUMN public.orders.request_id IS 'Khóa chống tạo trùng cho mỗi lần đặt hàng của một tài khoản';
COMMIT;
