-- Chỉ chạy nếu đã tạo orders bằng schema cũ; giữ nguyên dữ liệu đơn đã có.
BEGIN;
ALTER TABLE public.orders
    ADD COLUMN shipping_name text,
    ADD COLUMN shipping_phone text,
    ADD COLUMN shipping_address text,
    ADD COLUMN shipping_note text,
    ADD CONSTRAINT orders_shipping_valid CHECK (
        (shipping_name IS NULL AND shipping_phone IS NULL AND shipping_address IS NULL AND shipping_note IS NULL)
        OR (shipping_name IS NOT NULL AND shipping_phone IS NOT NULL AND shipping_address IS NOT NULL
            AND length(trim(shipping_name)) BETWEEN 2 AND 100
            AND shipping_phone ~ '^0[0-9]{9}$'
            AND length(trim(shipping_address)) BETWEEN 10 AND 500
            AND length(COALESCE(shipping_note, '')) <= 1000)
    );
COMMENT ON COLUMN public.orders.shipping_address IS 'Snapshot địa chỉ giao hàng khi đặt đơn; NULL ở đơn cũ chưa có thông tin giao hàng';
COMMIT;
