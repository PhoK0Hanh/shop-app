-- Seed dữ liệu shop-app từ lib/mock-data.ts.
-- Mở Query Tool của database shop_app và chạy toàn bộ file sau khi đã tạo 6 bảng.
-- Chạy lại sẽ cập nhật giá, tồn kho và thông tin của các ID mẫu theo file này.
-- File không xóa bản ghi ngoài dữ liệu mẫu; chỉ dùng để học/phát triển.
-- BEGIN/COMMIT đảm bảo các phần cùng thành công; nếu lỗi, chạy ROLLBACK trước khi thử lại.

BEGIN;
SET LOCAL search_path TO public;

-- 1. Danh mục phải có trước vì products tham chiếu category_id.
INSERT INTO categories (id, name, slug)
VALUES
    (E'cat-tshirt', E'Áo thun', E'tshirt'),
    (E'cat-shorts', E'Quần short', E'shorts'),
    (E'cat-shirt', E'Áo sơ mi', E'shirt'),
    (E'cat-hoodie', E'Áo hoodie', E'hoodie'),
    (E'cat-jeans', E'Quần jeans', E'jeans')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug;

-- 2. Các style dùng cho bộ lọc và bảng nối product_styles.
INSERT INTO styles (id, name, slug)
VALUES
    (E'style-casual', E'Thường ngày', E'casual'),
    (E'style-formal', E'Lịch sự', E'formal'),
    (E'style-party', E'Dự tiệc', E'party'),
    (E'style-gym', E'Thể thao', E'gym')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug;

-- 3. Giá nguyên VND; sale_price NULL nghĩa là không giảm giá.
-- Giữ nguyên ID và ngày tạo; updated_at thay đổi khi chạy seed.
INSERT INTO products (id, category_id, name, description, original_price, sale_price, is_active, sold_count, created_at)
VALUES
    (E'p1', E'cat-tshirt', E'Áo thun cotton cơ bản', E'Áo thun cotton dáng vừa, chất liệu thoáng mát, phù hợp mặc hằng ngày.', 189000, NULL, true, 152, E'2026-08-01T00:00:00Z'),
    (E'p2', E'cat-shirt', E'Áo sơ mi dáng ôm', E'Sơ mi dáng ôm, vải không nhăn, phù hợp đi làm hoặc dự tiệc.', 349000, NULL, true, 98, E'2026-08-02T00:00:00Z'),
    (E'p3', E'cat-hoodie', E'Áo hoodie dáng rộng', E'Hoodie dáng rộng, nỉ bông dày dặn, giữ ấm tốt.', 429000, NULL, true, 210, E'2026-08-03T00:00:00Z'),
    (E'p4', E'cat-jeans', E'Quần jeans dáng ôm', E'Quần jeans dáng ôm, co giãn nhẹ, dễ phối đồ.', 459000, NULL, true, 134, E'2026-05-01T00:00:00Z'),
    (E'p5', E'cat-shorts', E'Quần short tập luyện', E'Quần short tập luyện, vải co giãn 4 chiều, thấm hút mồ hôi.', 229000, NULL, true, 87, E'2026-08-12T00:00:00Z'),
    (E'p6', E'cat-shirt', E'Áo sơ mi họa tiết dự tiệc', E'Sơ mi hoạ tiết, chất liệu lụa mềm, nổi bật trong các buổi tiệc.', 389000, NULL, true, 56, E'2026-02-01T00:00:00Z'),
    (E'p7', E'cat-tshirt', E'Áo thun in hình', E'Áo thun in hình, chất liệu cotton 100%, dáng vừa.', 199000, NULL, true, 178, E'2026-01-14T00:00:00Z'),
    (E'p8', E'cat-jeans', E'Quần tây lịch sự', E'Quần tây dáng ôm, vải cao cấp, phù hợp đi làm.', 399000, NULL, true, 62, E'2026-05-20T00:00:00Z'),
    (E'p9', E'cat-tshirt', E'Áo thun cotton dáng rộng', E'Áo thun cotton dáng rộng, mềm mại, dễ phối đồ hằng ngày.', 250000, 200000, true, 120, E'2026-09-01T00:00:00Z'),
    (E'p10', E'cat-shirt', E'Áo sơ mi Oxford cổ điển', E'Sơ mi Oxford cổ điển, dáng vừa, phù hợp đi làm và gặp gỡ.', 400000, 300000, true, 85, E'2026-09-03T00:00:00Z'),
    (E'p11', E'cat-hoodie', E'Áo hoodie nỉ khóa kéo', E'Hoodie khóa kéo, lớp nỉ mềm giữ ấm, tiện mặc khi ra ngoài.', 500000, 350000, true, 165, E'2026-09-05T00:00:00Z'),
    (E'p12', E'cat-jeans', E'Quần jeans ống đứng', E'Quần jeans ống đứng, denim bền đẹp, phù hợp nhiều phong cách.', 600000, 360000, true, 142, E'2026-09-07T00:00:00Z'),
    (E'p13', E'cat-shorts', E'Quần short thể thao nhẹ', E'Quần short thể thao nhẹ, nhanh khô, thoải mái khi vận động.', 300000, 150000, true, 105, E'2026-09-09T00:00:00Z')
ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    original_price = EXCLUDED.original_price,
    sale_price = EXCLUDED.sale_price,
    is_active = EXCLUDED.is_active,
    sold_count = EXCLUDED.sold_count,
    created_at = EXCLUDED.created_at,
    updated_at = CURRENT_TIMESTAMP;

-- 4. Mỗi ảnh là một dòng; position giữ nguyên thứ tự ảnh trong mock data.
INSERT INTO product_images (id, product_id, url, alt_text, position)
VALUES
    (E'p1-image-0', E'p1', E'https://picsum.photos/seed/p1a/600/800', E'Áo thun cotton cơ bản - ảnh 1', 0),
    (E'p1-image-1', E'p1', E'https://picsum.photos/seed/p1b/600/800', E'Áo thun cotton cơ bản - ảnh 2', 1),
    (E'p2-image-0', E'p2', E'https://picsum.photos/seed/p2a/600/800', E'Áo sơ mi dáng ôm - ảnh 1', 0),
    (E'p2-image-1', E'p2', E'https://picsum.photos/seed/p2b/600/800', E'Áo sơ mi dáng ôm - ảnh 2', 1),
    (E'p3-image-0', E'p3', E'https://picsum.photos/seed/p3a/600/800', E'Áo hoodie dáng rộng - ảnh 1', 0),
    (E'p3-image-1', E'p3', E'https://picsum.photos/seed/p3b/600/800', E'Áo hoodie dáng rộng - ảnh 2', 1),
    (E'p4-image-0', E'p4', E'https://picsum.photos/seed/p4a/600/800', E'Quần jeans dáng ôm - ảnh 1', 0),
    (E'p4-image-1', E'p4', E'https://picsum.photos/seed/p4b/600/800', E'Quần jeans dáng ôm - ảnh 2', 1),
    (E'p5-image-0', E'p5', E'https://picsum.photos/seed/p5a/600/800', E'Quần short tập luyện - ảnh 1', 0),
    (E'p5-image-1', E'p5', E'https://picsum.photos/seed/p5b/600/800', E'Quần short tập luyện - ảnh 2', 1),
    (E'p6-image-0', E'p6', E'https://picsum.photos/seed/p6a/600/800', E'Áo sơ mi họa tiết dự tiệc - ảnh 1', 0),
    (E'p6-image-1', E'p6', E'https://picsum.photos/seed/p6b/600/800', E'Áo sơ mi họa tiết dự tiệc - ảnh 2', 1),
    (E'p7-image-0', E'p7', E'https://picsum.photos/seed/p7a/600/800', E'Áo thun in hình - ảnh 1', 0),
    (E'p7-image-1', E'p7', E'https://picsum.photos/seed/p7b/600/800', E'Áo thun in hình - ảnh 2', 1),
    (E'p8-image-0', E'p8', E'https://picsum.photos/seed/p8a/600/800', E'Quần tây lịch sự - ảnh 1', 0),
    (E'p8-image-1', E'p8', E'https://picsum.photos/seed/p8b/600/800', E'Quần tây lịch sự - ảnh 2', 1),
    (E'p9-image-0', E'p9', E'https://picsum.photos/seed/p9a/600/800', E'Áo thun cotton dáng rộng - ảnh 1', 0),
    (E'p9-image-1', E'p9', E'https://picsum.photos/seed/p9b/600/800', E'Áo thun cotton dáng rộng - ảnh 2', 1),
    (E'p10-image-0', E'p10', E'https://picsum.photos/seed/p10a/600/800', E'Áo sơ mi Oxford cổ điển - ảnh 1', 0),
    (E'p10-image-1', E'p10', E'https://picsum.photos/seed/p10b/600/800', E'Áo sơ mi Oxford cổ điển - ảnh 2', 1),
    (E'p11-image-0', E'p11', E'https://picsum.photos/seed/p11a/600/800', E'Áo hoodie nỉ khóa kéo - ảnh 1', 0),
    (E'p11-image-1', E'p11', E'https://picsum.photos/seed/p11b/600/800', E'Áo hoodie nỉ khóa kéo - ảnh 2', 1),
    (E'p12-image-0', E'p12', E'https://picsum.photos/seed/p12a/600/800', E'Quần jeans ống đứng - ảnh 1', 0),
    (E'p12-image-1', E'p12', E'https://picsum.photos/seed/p12b/600/800', E'Quần jeans ống đứng - ảnh 2', 1),
    (E'p13-image-0', E'p13', E'https://picsum.photos/seed/p13a/600/800', E'Quần short thể thao nhẹ - ảnh 1', 0),
    (E'p13-image-1', E'p13', E'https://picsum.photos/seed/p13b/600/800', E'Quần short thể thao nhẹ - ảnh 2', 1),
    (E'p13-image-2', E'p13', E'https://picsum.photos/seed/p13c/600/800', E'Quần short thể thao nhẹ - ảnh 3', 2),
    (E'p13-image-3', E'p13', E'https://picsum.photos/seed/p13d/600/800', E'Quần short thể thao nhẹ - ảnh 4', 3),
    (E'p13-image-4', E'p13', E'https://picsum.photos/seed/p13e/600/800', E'Quần short thể thao nhẹ - ảnh 5', 4),
    (E'p13-image-5', E'p13', E'https://picsum.photos/seed/p13f/600/800', E'Quần short thể thao nhẹ - ảnh 6', 5)
ON CONFLICT (id) DO UPDATE SET
    product_id = EXCLUDED.product_id,
    url = EXCLUDED.url,
    alt_text = EXCLUDED.alt_text,
    position = EXCLUDED.position;

-- 5. Mỗi tổ hợp sản phẩm + màu + size có một ID và tồn kho riêng.
-- Có cả biến thể stock = 0 để giao diện hiển thị trạng thái hết hàng.
INSERT INTO product_variants (id, product_id, color, size, stock, is_active)
VALUES
    (E'p1-white-S', E'p1', E'White', E'S', 10, true),
    (E'p1-white-M', E'p1', E'White', E'M', 25, true),
    (E'p1-white-L', E'p1', E'White', E'L', 15, true),
    (E'p1-white-XL', E'p1', E'White', E'XL', 5, true),
    (E'p1-white-XXL', E'p1', E'White', E'XXL', 0, true),
    (E'p1-black-S', E'p1', E'Black', E'S', 8, true),
    (E'p1-black-M', E'p1', E'Black', E'M', 18, true),
    (E'p1-black-L', E'p1', E'Black', E'L', 12, true),
    (E'p1-black-XL', E'p1', E'Black', E'XL', 6, true),
    (E'p1-black-XXL', E'p1', E'Black', E'XXL', 2, true),
    (E'p1-gray-S', E'p1', E'Gray', E'S', 5, true),
    (E'p1-gray-M', E'p1', E'Gray', E'M', 14, true),
    (E'p1-gray-L', E'p1', E'Gray', E'L', 10, true),
    (E'p1-gray-XL', E'p1', E'Gray', E'XL', 4, true),
    (E'p1-gray-XXL', E'p1', E'Gray', E'XXL', 1, true),
    (E'p1-navy-S', E'p1', E'Navy', E'S', 0, true),
    (E'p1-navy-M', E'p1', E'Navy', E'M', 12, true),
    (E'p1-navy-L', E'p1', E'Navy', E'L', 9, true),
    (E'p1-navy-XL', E'p1', E'Navy', E'XL', 5, true),
    (E'p1-navy-XXL', E'p1', E'Navy', E'XXL', 0, true),
    (E'p2-blue-S', E'p2', E'Blue', E'S', 8, true),
    (E'p2-blue-M', E'p2', E'Blue', E'M', 12, true),
    (E'p2-blue-L', E'p2', E'Blue', E'L', 10, true),
    (E'p2-blue-XL', E'p2', E'Blue', E'XL', 6, true),
    (E'p2-blue-XXL', E'p2', E'Blue', E'XXL', 2, true),
    (E'p2-white-S', E'p2', E'White', E'S', 6, true),
    (E'p2-white-M', E'p2', E'White', E'M', 15, true),
    (E'p2-white-L', E'p2', E'White', E'L', 11, true),
    (E'p2-white-XL', E'p2', E'White', E'XL', 4, true),
    (E'p2-white-XXL', E'p2', E'White', E'XXL', 0, true),
    (E'p3-gray-S', E'p3', E'Gray', E'S', 5, true),
    (E'p3-gray-M', E'p3', E'Gray', E'M', 20, true),
    (E'p3-gray-L', E'p3', E'Gray', E'L', 18, true),
    (E'p3-gray-XL', E'p3', E'Gray', E'XL', 10, true),
    (E'p3-gray-XXL', E'p3', E'Gray', E'XXL', 4, true),
    (E'p3-black-S', E'p3', E'Black', E'S', 8, true),
    (E'p3-black-M', E'p3', E'Black', E'M', 16, true),
    (E'p3-black-L', E'p3', E'Black', E'L', 14, true),
    (E'p3-black-XL', E'p3', E'Black', E'XL', 7, true),
    (E'p3-black-XXL', E'p3', E'Black', E'XXL', 3, true),
    (E'p3-green-S', E'p3', E'Green', E'S', 3, true),
    (E'p3-green-M', E'p3', E'Green', E'M', 10, true),
    (E'p3-green-L', E'p3', E'Green', E'L', 8, true),
    (E'p3-green-XL', E'p3', E'Green', E'XL', 0, true),
    (E'p3-green-XXL', E'p3', E'Green', E'XXL', 0, true),
    (E'p4-navy-S', E'p4', E'Navy', E'S', 6, true),
    (E'p4-navy-M', E'p4', E'Navy', E'M', 14, true),
    (E'p4-navy-L', E'p4', E'Navy', E'L', 16, true),
    (E'p4-navy-XL', E'p4', E'Navy', E'XL', 8, true),
    (E'p4-navy-XXL', E'p4', E'Navy', E'XXL', 0, true),
    (E'p4-blue-S', E'p4', E'Blue', E'S', 4, true),
    (E'p4-blue-M', E'p4', E'Blue', E'M', 12, true),
    (E'p4-blue-L', E'p4', E'Blue', E'L', 10, true),
    (E'p4-blue-XL', E'p4', E'Blue', E'XL', 5, true),
    (E'p4-blue-XXL', E'p4', E'Blue', E'XXL', 0, true),
    (E'p5-black-S', E'p5', E'Black', E'S', 12, true),
    (E'p5-black-M', E'p5', E'Black', E'M', 18, true),
    (E'p5-black-L', E'p5', E'Black', E'L', 14, true),
    (E'p5-black-XL', E'p5', E'Black', E'XL', 7, true),
    (E'p5-black-XXL', E'p5', E'Black', E'XXL', 3, true),
    (E'p6-burgundy-S', E'p6', E'Burgundy', E'S', 4, true),
    (E'p6-burgundy-M', E'p6', E'Burgundy', E'M', 10, true),
    (E'p6-burgundy-L', E'p6', E'Burgundy', E'L', 9, true),
    (E'p6-burgundy-XL', E'p6', E'Burgundy', E'XL', 5, true),
    (E'p6-burgundy-XXL', E'p6', E'Burgundy', E'XXL', 1, true),
    (E'p6-navy-S', E'p6', E'Navy', E'S', 2, true),
    (E'p6-navy-M', E'p6', E'Navy', E'M', 8, true),
    (E'p6-navy-L', E'p6', E'Navy', E'L', 6, true),
    (E'p6-navy-XL', E'p6', E'Navy', E'XL', 3, true),
    (E'p6-navy-XXL', E'p6', E'Navy', E'XXL', 0, true),
    (E'p7-black-S', E'p7', E'Black', E'S', 15, true),
    (E'p7-black-M', E'p7', E'Black', E'M', 22, true),
    (E'p7-black-L', E'p7', E'Black', E'L', 20, true),
    (E'p7-black-XL', E'p7', E'Black', E'XL', 9, true),
    (E'p7-black-XXL', E'p7', E'Black', E'XXL', 5, true),
    (E'p7-white-S', E'p7', E'White', E'S', 10, true),
    (E'p7-white-M', E'p7', E'White', E'M', 18, true),
    (E'p7-white-L', E'p7', E'White', E'L', 16, true),
    (E'p7-white-XL', E'p7', E'White', E'XL', 7, true),
    (E'p7-white-XXL', E'p7', E'White', E'XXL', 3, true),
    (E'p7-beige-S', E'p7', E'Beige', E'S', 5, true),
    (E'p7-beige-M', E'p7', E'Beige', E'M', 12, true),
    (E'p7-beige-L', E'p7', E'Beige', E'L', 9, true),
    (E'p7-beige-XL', E'p7', E'Beige', E'XL', 4, true),
    (E'p7-beige-XXL', E'p7', E'Beige', E'XXL', 0, true),
    (E'p8-beige-S', E'p8', E'Beige', E'S', 7, true),
    (E'p8-beige-M', E'p8', E'Beige', E'M', 13, true),
    (E'p8-beige-L', E'p8', E'Beige', E'L', 11, true),
    (E'p8-beige-XL', E'p8', E'Beige', E'XL', 6, true),
    (E'p8-beige-XXL', E'p8', E'Beige', E'XXL', 2, true),
    (E'p8-black-S', E'p8', E'Black', E'S', 5, true),
    (E'p8-black-M', E'p8', E'Black', E'M', 10, true),
    (E'p8-black-L', E'p8', E'Black', E'L', 12, true),
    (E'p8-black-XL', E'p8', E'Black', E'XL', 4, true),
    (E'p8-black-XXL', E'p8', E'Black', E'XXL', 1, true),
    (E'p9-green-S', E'p9', E'Green', E'S', 12, true),
    (E'p9-green-M', E'p9', E'Green', E'M', 20, true),
    (E'p9-green-L', E'p9', E'Green', E'L', 18, true),
    (E'p9-green-XL', E'p9', E'Green', E'XL', 8, true),
    (E'p9-green-XXL', E'p9', E'Green', E'XXL', 3, true),
    (E'p9-white-S', E'p9', E'White', E'S', 9, true),
    (E'p9-white-M', E'p9', E'White', E'M', 16, true),
    (E'p9-white-L', E'p9', E'White', E'L', 14, true),
    (E'p9-white-XL', E'p9', E'White', E'XL', 6, true),
    (E'p9-white-XXL', E'p9', E'White', E'XXL', 2, true),
    (E'p9-black-S', E'p9', E'Black', E'S', 10, true),
    (E'p9-black-M', E'p9', E'Black', E'M', 18, true),
    (E'p9-black-L', E'p9', E'Black', E'L', 15, true),
    (E'p9-black-XL', E'p9', E'Black', E'XL', 7, true),
    (E'p9-black-XXL', E'p9', E'Black', E'XXL', 4, true),
    (E'p9-beige-S', E'p9', E'Beige', E'S', 4, true),
    (E'p9-beige-M', E'p9', E'Beige', E'M', 11, true),
    (E'p9-beige-L', E'p9', E'Beige', E'L', 8, true),
    (E'p9-beige-XL', E'p9', E'Beige', E'XL', 0, true),
    (E'p9-beige-XXL', E'p9', E'Beige', E'XXL', 0, true),
    (E'p10-white-S', E'p10', E'White', E'S', 6, true),
    (E'p10-white-M', E'p10', E'White', E'M', 15, true),
    (E'p10-white-L', E'p10', E'White', E'L', 14, true),
    (E'p10-white-XL', E'p10', E'White', E'XL', 7, true),
    (E'p10-white-XXL', E'p10', E'White', E'XXL', 2, true),
    (E'p11-navy-S', E'p11', E'Navy', E'S', 5, true),
    (E'p11-navy-M', E'p11', E'Navy', E'M', 16, true),
    (E'p11-navy-L', E'p11', E'Navy', E'L', 12, true),
    (E'p11-navy-XL', E'p11', E'Navy', E'XL', 6, true),
    (E'p11-navy-XXL', E'p11', E'Navy', E'XXL', 1, true),
    (E'p11-gray-S', E'p11', E'Gray', E'S', 4, true),
    (E'p11-gray-M', E'p11', E'Gray', E'M', 12, true),
    (E'p11-gray-L', E'p11', E'Gray', E'L', 10, true),
    (E'p11-gray-XL', E'p11', E'Gray', E'XL', 5, true),
    (E'p11-gray-XXL', E'p11', E'Gray', E'XXL', 2, true),
    (E'p11-burgundy-S', E'p11', E'Burgundy', E'S', 0, true),
    (E'p11-burgundy-M', E'p11', E'Burgundy', E'M', 8, true),
    (E'p11-burgundy-L', E'p11', E'Burgundy', E'L', 7, true),
    (E'p11-burgundy-XL', E'p11', E'Burgundy', E'XL', 3, true),
    (E'p11-burgundy-XXL', E'p11', E'Burgundy', E'XXL', 0, true),
    (E'p12-blue-S', E'p12', E'Blue', E'S', 8, true),
    (E'p12-blue-M', E'p12', E'Blue', E'M', 14, true),
    (E'p12-blue-L', E'p12', E'Blue', E'L', 15, true),
    (E'p12-blue-XL', E'p12', E'Blue', E'XL', 9, true),
    (E'p12-blue-XXL', E'p12', E'Blue', E'XXL', 3, true),
    (E'p12-black-S', E'p12', E'Black', E'S', 6, true),
    (E'p12-black-M', E'p12', E'Black', E'M', 11, true),
    (E'p12-black-L', E'p12', E'Black', E'L', 12, true),
    (E'p12-black-XL', E'p12', E'Black', E'XL', 7, true),
    (E'p12-black-XXL', E'p12', E'Black', E'XXL', 1, true),
    (E'p13-gray-S', E'p13', E'Gray', E'S', 10, true),
    (E'p13-gray-M', E'p13', E'Gray', E'M', 18, true),
    (E'p13-gray-L', E'p13', E'Gray', E'L', 16, true),
    (E'p13-gray-XL', E'p13', E'Gray', E'XL', 8, true),
    (E'p13-gray-XXL', E'p13', E'Gray', E'XXL', 4, true),
    (E'p13-black-S', E'p13', E'Black', E'S', 8, true),
    (E'p13-black-M', E'p13', E'Black', E'M', 15, true),
    (E'p13-black-L', E'p13', E'Black', E'L', 12, true),
    (E'p13-black-XL', E'p13', E'Black', E'XL', 6, true),
    (E'p13-black-XXL', E'p13', E'Black', E'XXL', 2, true),
    (E'p13-navy-S', E'p13', E'Navy', E'S', 6, true),
    (E'p13-navy-M', E'p13', E'Navy', E'M', 12, true),
    (E'p13-navy-L', E'p13', E'Navy', E'L', 10, true),
    (E'p13-navy-XL', E'p13', E'Navy', E'XL', 5, true),
    (E'p13-navy-XXL', E'p13', E'Navy', E'XXL', 1, true),
    (E'p13-green-S', E'p13', E'Green', E'S', 3, true),
    (E'p13-green-M', E'p13', E'Green', E'M', 9, true),
    (E'p13-green-L', E'p13', E'Green', E'L', 7, true),
    (E'p13-green-XL', E'p13', E'Green', E'XL', 0, true),
    (E'p13-green-XXL', E'p13', E'Green', E'XXL', 0, true)
ON CONFLICT (id) DO UPDATE SET
    product_id = EXCLUDED.product_id,
    color = EXCLUDED.color,
    size = EXCLUDED.size,
    stock = EXCLUDED.stock,
    is_active = EXCLUDED.is_active;

-- 6. Khóa chính gồm product_id + style_id; bỏ qua liên kết đã tồn tại.
INSERT INTO product_styles (product_id, style_id)
VALUES
    (E'p1', E'style-casual'),
    (E'p1', E'style-gym'),
    (E'p2', E'style-formal'),
    (E'p2', E'style-party'),
    (E'p3', E'style-casual'),
    (E'p4', E'style-casual'),
    (E'p4', E'style-formal'),
    (E'p5', E'style-gym'),
    (E'p6', E'style-party'),
    (E'p7', E'style-casual'),
    (E'p8', E'style-formal'),
    (E'p9', E'style-casual'),
    (E'p10', E'style-formal'),
    (E'p10', E'style-casual'),
    (E'p11', E'style-casual'),
    (E'p11', E'style-gym'),
    (E'p12', E'style-casual'),
    (E'p12', E'style-party'),
    (E'p13', E'style-gym'),
    (E'p13', E'style-casual')
ON CONFLICT (product_id, style_id) DO NOTHING;

COMMIT;

-- Kiểm tra số dòng sau khi nhập. Nếu chưa có dữ liệu khác, actual_count bằng expected_count.
SELECT 'categories' AS table_name, COUNT(*) AS actual_count, 5 AS expected_count FROM categories
UNION ALL
SELECT 'styles' AS table_name, COUNT(*) AS actual_count, 4 AS expected_count FROM styles
UNION ALL
SELECT 'products' AS table_name, COUNT(*) AS actual_count, 13 AS expected_count FROM products
UNION ALL
SELECT 'product_images' AS table_name, COUNT(*) AS actual_count, 30 AS expected_count FROM product_images
UNION ALL
SELECT 'product_variants' AS table_name, COUNT(*) AS actual_count, 165 AS expected_count FROM product_variants
UNION ALL
SELECT 'product_styles' AS table_name, COUNT(*) AS actual_count, 20 AS expected_count FROM product_styles;
