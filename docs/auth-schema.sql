-- Tạo bảng tài khoản và phiên đăng nhập trong database shop_app.
-- Chạy toàn bộ file một lần trong pgAdmin; không chứa tài khoản hay mật khẩu mẫu.
-- Nếu có lỗi trong transaction, chạy ROLLBACK trước khi thử lại.
BEGIN;
SET LOCAL search_path TO public;

CREATE TABLE users (
    -- Backend tạo UUID dưới dạng chuỗi; ID không thay đổi khi sửa username.
    id text PRIMARY KEY,
    name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100),
    -- Username lưu chữ thường; chỉ dùng chữ, số, dấu gạch dưới hoặc chấm.
    username text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_.]{3,30}$'),
    -- Chuẩn hóa email ở backend trước khi lưu để chống trùng khác chữ hoa/thường.
    email text NOT NULL UNIQUE CHECK (
        email = lower(trim(email)) AND length(email) BETWEEN 3 AND 254
    ),
    -- Chỉ lưu mật khẩu đã băm kèm salt/thông số thuật toán; không lưu mật khẩu gốc.
    password_hash text NOT NULL CHECK (length(password_hash) > 0),
    role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    -- Cookie chứa token ngẫu nhiên; database chỉ giữ SHA-256 dạng hex của token đó.
    token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamptz NOT NULL,
    CHECK (expires_at > created_at)
);

-- Một người dùng có thể có nhiều phiên, ví dụ đăng nhập trên PC và điện thoại.
CREATE INDEX sessions_user_idx ON sessions(user_id);
-- Hỗ trợ dọn các phiên hết hạn; backend vẫn phải kiểm tra hạn trong mỗi lần xác thực.
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

COMMIT;

-- Kiểm tra hai bảng đã tạo trong schema public.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('users', 'sessions')
ORDER BY table_name;
