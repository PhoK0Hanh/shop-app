# SHOP.CO — Shop App

<!-- Hướng dẫn mô tả chức năng và cấu hình hiện tại, không chứa thông tin đăng nhập thật. -->

Website bán quần áo với giao diện tiếng Việt, giá VND và trang quản trị riêng. Dự án phục vụ học tập: xây dựng giao diện, REST API, xác thực Firebase và xử lý dữ liệu PostgreSQL trong cùng ứng dụng Next.js.

## Chức năng

- Trang chủ: hàng mới, sản phẩm bán chạy và lựa chọn theo phong cách.
- Danh sách sản phẩm: lọc danh mục, phong cách, kích cỡ, khoảng giá; sắp xếp và phân trang 9 sản phẩm. Bộ lọc được lưu trên URL.
- Chi tiết sản phẩm: thư viện ảnh, chọn màu/kích cỡ/số lượng, sản phẩm gợi ý.
- Giỏ hàng lưu ở `localStorage`; giá và tồn kho được kiểm tra lại qua API.
- Đăng ký/đăng nhập Email/Password bằng Firebase; server xác thực session và đồng bộ hồ sơ với PostgreSQL.
- Đặt hàng sau khi đăng nhập và nhập thông tin giao hàng; xem và hủy đơn đang chuẩn bị.
- Admin: tổng quan theo thời gian, biểu đồ số đơn, cảnh báo tồn kho, quản lý sản phẩm/biến thể, đơn hàng và khóa/mở tài khoản.

Luồng đặt hàng hiện **bỏ qua thanh toán trực tuyến**. Đơn có các trạng thái `preparing`, `shipping`, `delivered`, `cancelled`; admin cập nhật trạng thái giao hàng thủ công. Chính sách giao/đổi hàng đang dùng nội dung tạm.

## Tech stack

| Thành phần | Công nghệ |
|---|---|
| Frontend và backend | Next.js 16.3.8, App Router, Route Handlers |
| Giao diện | React 19, TypeScript, Tailwind CSS 4 |
| Component và icon | Base UI, shadcn/ui, Lucide React, React Icons |
| REST API client | Axios |
| Database | PostgreSQL, truy vấn SQL bằng `pg` |
| Xác thực | Firebase Authentication, Firebase Admin SDK |
| Kiểm tra | ESLint, TypeScript, Node.js Test Runner |

Luồng dữ liệu: **component → Axios → `/api/...` → hàm server trong `lib/` → PostgreSQL**. Session và quyền admin được kiểm tra tại server; mật khẩu Firebase không lưu trong database của shop.

## Yêu cầu

- Node.js **24.12.0 trở lên** và npm: các package Firebase đang dùng yêu cầu phiên bản Node này.
- PostgreSQL; có thể dùng pgAdmin 4 để tạo database và chạy SQL.
- Một project Firebase đã bật Authentication → Email/Password.
- Git để clone dự án.

## Cài đặt

### 1. Clone và cài dependency

```bash
git clone https://github.com/PhoK0Hanh/shop-app.git
cd shop-app
npm ci
```

### 2. Tạo database

Trong pgAdmin 4, kết nối PostgreSQL và tạo database tên `shop_app` bằng **Databases → Create → Database**. Hoặc mở Query Tool ở database `postgres` và chạy [create-database.sql](docs/create-database.sql).

Sau đó chọn **database `shop_app`**, mở Query Tool và chạy toàn bộ từng file theo thứ tự:

| Thứ tự | File | Mục đích |
|---|---|---|
| 1 | [catalog-schema.sql](docs/catalog-schema.sql) | Tạo 6 bảng danh mục, sản phẩm, ảnh, biến thể và phong cách |
| 2 | [auth-schema.sql](docs/auth-schema.sql) | Tạo hồ sơ người dùng và bảng session của thiết kế cũ |
| 3 | [firebase-users-migration.sql](docs/firebase-users-migration.sql) | Thêm Firebase UID, cho phép hồ sơ Firebase không có mật khẩu nội bộ |
| 4 | [orders-schema.sql](docs/orders-schema.sql) | Tạo đơn hàng và chi tiết đơn, gồm địa chỉ giao hàng và trạng thái hủy |
| 5 | [seed.sql](docs/seed.sql) | Thêm 5 danh mục, 4 phong cách và 13 sản phẩm mẫu tiếng Việt |

Với database mới, **không chạy** [orders-shipping-migration.sql](docs/orders-shipping-migration.sql) và [orders-cancellation-migration.sql](docs/orders-cancellation-migration.sql): `orders-schema.sql` đã có các thay đổi này. Hai file migration được giữ để nâng cấp database dùng schema cũ.

Các schema/migration chỉ chạy một lần. `seed.sql` có thể chạy lại nhưng sẽ cập nhật giá, tồn kho và thông tin của sản phẩm mẫu; chỉ dùng trên dữ liệu phát triển. Nếu Query Tool báo transaction đang lỗi, chạy `ROLLBACK;` trước khi sửa và chạy lại file.

### 3. Cấu hình Firebase

1. Tạo project ở [Firebase Console](https://console.firebase.google.com/).
2. Trong Project settings, đăng ký ứng dụng Web và lấy `apiKey`, `authDomain`, `projectId`, `appId`.
3. Trong Authentication → Sign-in method, bật **Email/Password**. Kiểm tra Authentication → Settings → Authorized domains và thêm `localhost` khi chạy local; thêm domain website khi triển khai.
4. Trong Project settings → Service accounts, tạo private key cho Firebase Admin. Lấy `project_id`, `client_email`, `private_key` để cấu hình biến môi trường phía server.

Firebase Web và Firebase Admin phải thuộc cùng project. Không đưa service-account JSON hoặc private key vào Git.

### 4. Cấu hình biến môi trường

Sao chép [.env.example](.env.example) thành `.env.local` ở thư mục gốc dự án.

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS/Linux:

```bash
cp .env.example .env.local
```

Điền thông tin kết nối PostgreSQL và Firebase:

| Nhóm | Biến |
|---|---|
| PostgreSQL | `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` |
| Firebase Web | `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` |
| Firebase Admin | `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` |

Private key đặt trong dấu nháy kép trên một dòng; dùng `\n` cho các ký tự xuống dòng. `PGUSER` là tài khoản PostgreSQL, thường là `postgres`, không phải tên server hiển thị trong pgAdmin.

Chỉ cấu hình Web dùng tiền tố `NEXT_PUBLIC_`. `.env.local` được Git bỏ qua. Sau khi đổi biến môi trường, dừng dev server bằng Ctrl+C rồi chạy lại.

### 5. Chạy dự án

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Trang `/test-db` dùng để kiểm tra API đọc sản phẩm mẫu `p1`.

## Database và quan hệ

| Bảng | Vai trò |
|---|---|
| `categories` | Một danh mục có nhiều sản phẩm |
| `products` | Thông tin sản phẩm, giá, trạng thái hiển thị |
| `product_images` | Nhiều ảnh của một sản phẩm, sắp theo `position` |
| `product_variants` | Biến thể màu + kích cỡ, tồn kho và trạng thái |
| `styles` / `product_styles` | Quan hệ nhiều–nhiều giữa sản phẩm và phong cách |
| `users` | Hồ sơ và quyền website, liên kết Firebase bằng `firebase_uid` |
| `sessions` | Bảng từ thiết kế xác thực cũ; luồng Firebase hiện không dùng bảng này |
| `orders` | Đơn của người dùng, trạng thái và thông tin người nhận tại lúc đặt |
| `order_items` | Snapshot sản phẩm, màu/kích cỡ, đơn giá và số lượng |

Một sản phẩm thuộc một danh mục, có nhiều ảnh/biến thể và nhiều phong cách. Một người dùng có nhiều đơn; mỗi đơn có nhiều dòng chi tiết. Snapshot giữ lịch sử khi sản phẩm thay đổi. Backend tính lại giá, kiểm tra tồn kho, ghi đơn và trừ kho trong transaction; hủy đơn đang chuẩn bị sẽ hoàn kho.

## Tạo tài khoản admin

1. Đăng ký bằng giao diện `/signup`, đăng nhập để hồ sơ được đồng bộ vào `users`.
2. Trong Query Tool, thay email mẫu bằng email tài khoản của bạn rồi chạy:

```sql
-- Cấp quyền cho hồ sơ đã được Firebase xác thực và đồng bộ.
UPDATE public.users
SET role = 'admin', updated_at = CURRENT_TIMESTAMP
WHERE email = 'your-admin@example.com'
  AND firebase_uid IS NOT NULL
  AND is_active = true;
```

3. Đăng xuất rồi đăng nhập lại. Tài khoản admin được đưa đến `/admin`.

Dự án không tạo sẵn tài khoản `admin/1234`. API quản trị kiểm tra quyền trong PostgreSQL. Trên giao diện mua sắm, nút thêm giỏ hàng và nút giỏ hàng bị vô hiệu hóa cho admin.

## Dữ liệu đơn mẫu cho biểu đồ

Sau khi cấu hình `.env.local` và tạo đủ bảng, có thể thêm đơn mẫu trong 30 ngày gần đây:

```bash
node --env-file=.env.local scripts/seed-demo-orders.mjs
```

Script tạo hồ sơ mẫu bị khóa, đơn có tiền tố `demo-order-` và chi tiết sản phẩm giả. Các đơn này được tính vào thống kê admin; script không thay đổi tồn kho sản phẩm thật và không tạo trùng ID khi chạy lại trong cùng ngày. Muốn xóa bộ đơn mẫu, chạy [remove-demo-orders.sql](docs/remove-demo-orders.sql).

[localize-catalog.mjs](scripts/localize-catalog.mjs) dành cho database đã seed bằng bộ tên tiếng Anh cũ; seed mới trong `/docs` đã dùng tiếng Việt.

## Cấu trúc dự án

```text
app/                 Trang Next.js và REST API
  admin/             Tổng quan, sản phẩm, đơn hàng, tài khoản
  api/               Catalog, sản phẩm, session, đơn hàng và API admin
components/          Giao diện sản phẩm, auth, giỏ hàng và admin
lib/                 Truy vấn SQL, kiểu dữ liệu, Axios, Firebase và logic dùng chung
docs/                Schema, migration và seed SQL được chia sẻ trong Git
scripts/             Seed đơn mẫu và chuyển tên catalog cũ sang tiếng Việt
tests/               Kiểm thử logic, API, session và transaction
public/              Ảnh và tài nguyên tĩnh
```

`myDocs/` chứa tài liệu cá nhân, được bỏ qua bởi Git.

## Các lệnh thường dùng

```bash
npm run dev
npm run lint
npm run build
npm run start
```

`npm run start` chạy bản production sau khi build. Chạy toàn bộ kiểm thử:

```bash
node --env-file=.env.local --test tests/*.test.mjs
```

Kiểm thử PostgreSQL yêu cầu kết nối database hợp lệ. Các bài kiểm thử nghiệp vụ dùng bảng TEMP trên connection riêng, không sửa dữ liệu shop thật.

## Phạm vi hiện tại

Dự án chưa tích hợp cổng thanh toán hoặc quản lý giỏ hàng trên server. Danh sách quản trị tải toàn bộ dữ liệu rồi lọc/phân trang phía client; danh sách shop đã lọc/phân trang tại API. Có thể mở rộng các phần này khi dữ liệu và nhu cầu tăng lên.
