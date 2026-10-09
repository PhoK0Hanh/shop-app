-- Bản thiết kế PostgreSQL cho danh mục shop-app; chưa chạy trên database.
-- Giữ ID text để tương thích URL sản phẩm và variantId trong giỏ hàng hiện tại.

CREATE TABLE categories (
    id text PRIMARY KEY,
    name text NOT NULL CHECK (length(trim(name)) > 0),
    slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE styles (
    id text PRIMARY KEY,
    name text NOT NULL CHECK (length(trim(name)) > 0),
    slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE products (
    id text PRIMARY KEY,
    category_id text NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name text NOT NULL CHECK (length(trim(name)) > 0),
    description text NOT NULL DEFAULT '',
    original_price integer NOT NULL CHECK (original_price > 0),
    sale_price integer,
    is_active boolean NOT NULL DEFAULT true,
    sold_count integer NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT products_valid_sale_price CHECK (
        sale_price IS NULL OR (sale_price >= 0 AND sale_price < original_price)
    )
);

CREATE TABLE product_images (
    id text PRIMARY KEY,
    product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url text NOT NULL CHECK (length(trim(url)) > 0),
    alt_text text NOT NULL DEFAULT '',
    position integer NOT NULL CHECK (position >= 0),
    UNIQUE (product_id, position)
);

CREATE TABLE product_variants (
    id text PRIMARY KEY,
    product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color text NOT NULL CHECK (color IN ('Black', 'White', 'Gray', 'Navy', 'Blue', 'Beige', 'Green', 'Burgundy')),
    size text NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', 'XXL')),
    stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active boolean NOT NULL DEFAULT true,
    UNIQUE (product_id, color, size)
);

-- Bảng nối biểu diễn quan hệ nhiều sản phẩm với nhiều style.
CREATE TABLE product_styles (
    product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    style_id text NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, style_id)
);

-- PRIMARY KEY và UNIQUE đã tạo index tương ứng; chỉ thêm index cho truy vấn khác.
CREATE INDEX products_category_idx ON products(category_id);
CREATE INDEX products_active_created_idx ON products(created_at DESC, id) WHERE is_active;
CREATE INDEX products_active_price_idx ON products((COALESCE(sale_price, original_price)), id) WHERE is_active;
CREATE INDEX product_styles_style_idx ON product_styles(style_id, product_id);
CREATE INDEX product_variants_available_size_idx ON product_variants(size, product_id) WHERE is_active AND stock > 0;

-- Backend phải cập nhật updated_at khi UPDATE và kiểm tra có ảnh/biến thể trước khi xuất bản.
