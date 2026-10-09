-- Chuyển bảng users hiện có để hỗ trợ Firebase Authentication.
-- Chạy toàn bộ file MỘT LẦN trong Query Tool của database shop_app.
-- Không tự liên kết tài khoản cũ theo email; backend sẽ sử dụng Firebase UID đã xác thực.
-- Nếu gặp lỗi trong transaction, chạy ROLLBACK trước khi kiểm tra và thử lại.
BEGIN;

ALTER TABLE public.users
    -- NULL dành cho hồ sơ cũ chưa liên kết Firebase; mỗi UID chỉ thuộc một hồ sơ.
    ADD COLUMN firebase_uid text
        CONSTRAINT users_firebase_uid_key UNIQUE
        CONSTRAINT users_firebase_uid_check CHECK (
            length(firebase_uid) BETWEEN 1 AND 128
            AND firebase_uid = trim(firebase_uid)
        ),
    -- Firebase quản lý mật khẩu: hồ sơ Firebase không cần username hoặc password_hash.
    ALTER COLUMN username DROP NOT NULL,
    ALTER COLUMN password_hash DROP NOT NULL,
    -- Giữ hồ sơ cũ có mật khẩu băm; hồ sơ mới phải có UID hoặc thông tin xác thực cũ.
    ADD CONSTRAINT users_auth_identity_check CHECK (
        firebase_uid IS NOT NULL OR password_hash IS NOT NULL
    );

COMMENT ON COLUMN public.users.firebase_uid IS
    'UID từ Firebase Admin đã xác thực. NULL cho hồ sơ cũ chưa liên kết; không tự ghép theo email.';
COMMENT ON COLUMN public.users.username IS
    'Username của thiết kế xác thực cũ. Có thể NULL khi dùng Firebase.';
COMMENT ON COLUMN public.users.password_hash IS
    'Mật khẩu băm của thiết kế cũ. Hồ sơ Firebase mới dùng NULL, không lưu mật khẩu Firebase.';

-- ID, tên, email, quyền, trạng thái và dữ liệu cũ không bị thay đổi.
-- Bảng sessions cũ vẫn được giữ; cookie Firebase hiện không dùng bảng này.
COMMIT;

-- Kiểm tra sau khi chạy: firebase_uid, username, password_hash đều có is_nullable = YES.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name IN ('id', 'firebase_uid', 'username', 'password_hash')
ORDER BY ordinal_position;

-- Chỉ xem số hồ sơ đã liên kết, không xuất email hoặc mật khẩu băm.
SELECT count(*) AS total_users,
       count(firebase_uid) AS linked_firebase_users
FROM public.users;
