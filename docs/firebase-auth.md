# Xác thực Firebase phía server

<!-- Form và navbar đã nối API phiên; Firebase Admin chỉ chạy trên server. -->

Form đăng ký/đăng nhập sử dụng Firebase Web SDK, rồi gọi `POST /api/auth/session` để đổi ID token đã xác thực thành cookie HttpOnly. Đăng nhập chỉ quay về trang trước sau khi cookie được tạo. Đăng ký lưu họ tên, làm mới token rồi tạo cookie. Nếu tài khoản đã tạo nhưng bước tạo phiên lỗi, form hướng dẫn chuyển sang đăng nhập, tránh đăng ký trùng.

`GET /api/auth/session` trả về tài khoản của phiên hoặc HTTP 401 khi chưa có phiên hợp lệ. Nút đăng xuất gọi `DELETE /api/auth/session` trước rồi đăng xuất Firebase phía trình duyệt. Nếu xóa cookie thất bại, giữ trạng thái tài khoản và hiển thị lỗi để thử lại. Sau khi thay đổi cookie, giao diện làm mới dữ liệu server. Cookie hết hạn sau 5 ngày; phiên Firebase phía trình duyệt có thể vẫn tồn tại, nên thao tác cần bảo vệ luôn phải kiểm tra server và yêu cầu đăng nhập lại nếu cookie hết hạn.

Cookie có hạn 5 ngày, SameSite=Lax và Secure khi chạy production. API tạo/xóa phiên chỉ nhận Origin trùng với website. POST nhận JSON `{ "idToken": "..." }`, kiểm tra token và yêu cầu lần đăng nhập diễn ra trong vòng 5 phút. Server Components hoặc API cần bảo vệ có thể gọi `getSessionUser()`; trả về `null` khi không có phiên hợp lệ. UID chỉ là định danh, chưa có phân quyền admin hoặc đồng bộ PostgreSQL.

## Thiết lập Firebase Admin

1. Mở đúng project trong Firebase Console → Project settings → Service accounts → Firebase Admin SDK.
2. Bấm Generate new private key và tải JSON. Lưu ở vị trí riêng, không đặt trong repository hoặc thư mục `public`.
3. Trong `.env.local`, thêm ba biến phía dưới từ các trường tương ứng trong JSON:

```dotenv
# Cấu hình server; không thêm tiền tố NEXT_PUBLIC_ vào các biến này.
FIREBASE_ADMIN_PROJECT_ID=gia-tri-project_id
FIREBASE_ADMIN_CLIENT_EMAIL=gia-tri-client_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Giữ dấu ngoặc kép quanh private key và các ký tự `\n` như trong chuỗi `private_key` của JSON. Không gửi private key vào chat. Project ID phải trùng với project đã cấu hình Firebase Web SDK.

4. Dừng dev server bằng Ctrl+C rồi chạy lại `npm run dev`.
5. Đăng nhập trên website rồi mở `/api/auth/session` trong cùng trình duyệt để xem UID/email của phiên. Đăng xuất và mở lại URL đó: kết quả phải là `{ "user": null }`, HTTP 401.

## PostgreSQL

Hai bảng trong `auth-schema.sql` là thiết kế xác thực tự quản lý trước đây. Hiện chưa sử dụng chúng trong luồng Firebase. Không ghi mật khẩu Firebase hoặc chuỗi giả vào `password_hash`. Giai đoạn tiếp theo cần migration để liên kết hồ sơ bằng Firebase UID; các bảng sản phẩm không thay đổi.

Tài liệu: [Firebase Admin setup](https://firebase.google.com/docs/admin/setup), [Firebase session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies).
