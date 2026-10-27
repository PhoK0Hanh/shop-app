# SHOP.CO — Website bán quần áo

<!-- Giới thiệu dự án và hướng dẫn chạy local; các cấu hình bên dưới chỉ là giá trị mẫu. -->

## 1. Giới thiệu

SHOP.CO là website bán quần áo với giao diện tiếng Việt, giá tiền VND và hai khu vực dành cho **khách hàng** và **quản trị viên**. Khách hàng có thể xem sản phẩm, chọn biến thể, thêm vào giỏ và đặt hàng. Quản trị viên quản lý sản phẩm, tồn kho, đơn hàng và tài khoản.

Dự án phục vụ học tập và thực hành phát triển ứng dụng full-stack: xây dựng giao diện React, REST API, xác thực Firebase và xử lý dữ liệu PostgreSQL trong cùng một ứng dụng Next.js.

**Xem thử:** [SHOP.CO Demo](https://shop-app-one-phi.vercel.app/)

Để thử giao diện quản trị mà không cần tài khoản, mở `/login` khi chưa đăng nhập và bấm **Trải nghiệm trang quản trị**. Khu `/demo/admin` cho phép thử quản lý sản phẩm, biến thể, đơn hàng và tài khoản trên bộ dữ liệu giả riêng. Thay đổi lưu trong `sessionStorage`, giữ khi F5 và bị xóa khi bấm **Thoát demo**; nút **Đặt lại dữ liệu** khôi phục dữ liệu mẫu. Chế độ này không tạo phiên admin thật, không đọc thông tin khách hàng thật và không ghi vào database.

## 2. Chức năng

### Dành cho khách hàng

| Khu vực               | Chức năng                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Trang chủ             | Hiển thị sản phẩm mới, bán chạy và các phong cách thời trang                                                            |
| Danh sách sản phẩm    | Lọc theo danh mục, phong cách, kích cỡ và khoảng giá; lưu bộ lọc trên URL                                               |
| Sắp xếp và phân trang | Mới nhất, cũ nhất, giá tăng/giảm, tên và bán chạy; 9 sản phẩm mỗi trang                                                 |
| Chi tiết sản phẩm     | Xem thư viện ảnh, mô tả, chọn màu/kích cỡ/số lượng và xem sản phẩm gợi ý                                                |
| Tài khoản             | Đăng ký, đăng nhập bằng email và mật khẩu qua Firebase; đăng xuất                                                       |
| Giỏ hàng              | Thêm, cập nhật số lượng, xóa sản phẩm; lưu giỏ trong trình duyệt bằng `localStorage`                                    |
| Đặt hàng              | Yêu cầu đăng nhập và nhập thông tin giao hàng; server kiểm tra lại giá và tồn kho trước khi tạo đơn                     |
| Đơn hàng              | Xem đơn của tài khoản đang đăng nhập, theo dõi trạng thái và hủy đơn đang chuẩn bị                                      |
| Trải nghiệm giao diện | Responsive, skeleton khi tải trang chủ/danh sách sản phẩm, hiệu ứng hover và chuyển động nhẹ có hỗ trợ giảm chuyển động |

### Dành cho quản trị viên

| Khu vực             | Chức năng                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Tổng quan           | Thống kê theo thời gian, biểu đồ số đơn theo ngày, đơn gần đây và cảnh báo tồn kho           |
| Sản phẩm            | Tìm kiếm, thêm, sửa, ẩn/hiện và xóa theo điều kiện; quản lý ảnh, danh mục, phong cách và giá |
| Biến thể và tồn kho | Xem và chỉnh biến thể màu/kích cỡ cùng số lượng tồn kho                                      |
| Đơn hàng            | Xem chi tiết, thông tin giao hàng và cập nhật trạng thái thủ công                            |
| Tài khoản           | Xem danh sách, tìm kiếm và khóa/mở khóa tài khoản                                            |
| Phân quyền          | Kiểm tra quyền admin ở server trước khi cho phép sử dụng chức năng quản trị                  |

### Luồng đặt hàng và phạm vi hiện tại

```text
Chọn sản phẩm → Giỏ hàng → Đăng nhập → Nhập thông tin giao hàng → Tạo đơn
```

| Trạng thái đơn       | Giá trị trong database |
| -------------------- | ---------------------- |
| Đang chuẩn bị        | `preparing`            |
| Đang giao            | `shipping`             |
| Giao hàng thành công | `delivered`            |
| Đã hủy               | `cancelled`            |

Dự án **chưa tích hợp thanh toán trực tuyến**: xác nhận đặt hàng sẽ tạo đơn ngay. Backend tính lại giá và trừ tồn kho trong transaction; hủy đơn đang chuẩn bị sẽ hoàn lại tồn kho.

Giỏ hàng chưa đồng bộ giữa các thiết bị. Một số liên kết ở footer dẫn tới trang minh họa `/test`. Danh sách quản trị lọc/phân trang phía client; danh sách shop lọc/phân trang tại API.

## 3. Công nghệ sử dụng

| Thành phần        | Công nghệ và vai trò                                                                   |
| ----------------- | -------------------------------------------------------------------------------------- |
| Framework         | Next.js 16.3.8 — App Router cho các trang, Route Handlers cho REST API                 |
| Giao diện         | React 19, TypeScript, Tailwind CSS 4                                                   |
| Component và icon | Base UI, shadcn/ui, Lucide React, React Icons                                          |
| Gọi API           | Axios và custom hook quản lý dữ liệu, trạng thái tải, lỗi và thử lại                   |
| Backend runtime   | Node.js                                                                                |
| Database          | PostgreSQL; truy vấn SQL trực tiếp bằng thư viện `pg`                                  |
| Xác thực          | Firebase Authentication cho đăng ký/đăng nhập; Firebase Admin SDK xác thực phía server |
| Kiểm tra          | ESLint, TypeScript và Node.js Test Runner                                              |

Luồng lấy dữ liệu của giao diện:

```text
Component → Axios → /api/... → Hàm xử lý ở server → PostgreSQL
```

Frontend và backend nằm chung dự án Next.js, không cần chạy server Express riêng. Firebase quản lý thông tin đăng nhập; PostgreSQL lưu hồ sơ và quyền người dùng liên kết qua `firebase_uid`. Website sử dụng cookie phiên HttpOnly và kiểm tra quyền ở server. Mật khẩu Firebase không được lưu trong database của shop.

### Cấu trúc thư mục

```text
app/                 Các trang và REST API của Next.js
  admin/             Tổng quan, sản phẩm, đơn hàng và tài khoản
  api/               API sản phẩm, danh mục, xác thực, đơn hàng và quản trị
components/          Component giao diện dùng chung và theo chức năng
lib/                 Truy vấn SQL, Firebase, Axios, kiểu dữ liệu và logic dùng chung
docs/                Schema, migration, dữ liệu mẫu và tài liệu database
tests/               Kiểm thử logic, API, xác thực và thao tác database
public/              Hình ảnh và tài nguyên tĩnh
```

## 4. Cài đặt và chạy local

### Bước 1 — Chuẩn bị môi trường

- **Node.js 24.12.0 trở lên** và npm để đáp ứng yêu cầu của các package Firebase đang dùng.
- **PostgreSQL** đang chạy; có thể dùng **pgAdmin 4** để quản lý và thực thi SQL.
- Tài khoản **Firebase** để tạo project xác thực riêng.
- **Git** để tải mã nguồn.

Kiểm tra Node.js và npm trong terminal:

```bash
node -v
npm -v
```

### Bước 2 — Tải mã nguồn và cài thư viện

```bash
git clone https://github.com/PhoK0Hanh/shop-app.git
cd shop-app
npm ci
```

Các lệnh tiếp theo đều chạy tại thư mục `shop-app`, nơi chứa `package.json`.

### Bước 3 — Tạo database và dữ liệu mẫu

Trong pgAdmin 4, kết nối PostgreSQL, chọn **Databases → Create → Database** và tạo database tên `shop_app`.

Hoặc mở Query Tool của database `postgres` và chạy [create-database.sql](docs/create-database.sql).

Sau đó mở Query Tool của **database `shop_app`**. Mở, chạy toàn bộ và kiểm tra thành công từng file theo thứ tự:

| Thứ tự | File                                                              | Nội dung                                                                     |
| ------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1      | [catalog-schema.sql](docs/catalog-schema.sql)                     | Tạo 6 bảng cho danh mục, sản phẩm, ảnh, biến thể và phong cách               |
| 2      | [auth-schema.sql](docs/auth-schema.sql)                           | Tạo bảng người dùng và bảng session của thiết kế xác thực cũ                 |
| 3      | [firebase-users-migration.sql](docs/firebase-users-migration.sql) | Thêm Firebase UID; cho phép hồ sơ Firebase không có username/mật khẩu nội bộ |
| 4      | [orders-schema.sql](docs/orders-schema.sql)                       | Tạo đơn hàng và chi tiết đơn, gồm thông tin giao hàng và trạng thái hủy      |
| 5      | [seed.sql](docs/seed.sql)                                         | Thêm 5 danh mục, 4 phong cách và 13 sản phẩm mẫu                             |

Chạy schema/migration một lần khi khởi tạo. Chạy lại `seed.sql` sẽ cập nhật thông tin, giá và tồn kho của sản phẩm mẫu. Nếu Query Tool báo transaction đang lỗi, chạy `ROLLBACK;`, xử lý nguyên nhân rồi chạy lại file.

Database gồm ba nhóm:

- **Sản phẩm:** `categories`, `products`, `product_images`, `product_variants`, `styles`, `product_styles`.
- **Người dùng:** `users`; bảng `sessions` thuộc thiết kế cũ, không dùng trong luồng Firebase hiện tại.
- **Đơn hàng:** `orders`, `order_items`; chi tiết đơn lưu thông tin sản phẩm tại thời điểm mua để giữ lịch sử khi sản phẩm thay đổi.

Xem sơ đồ và giải thích tại [Quan hệ giữa các bảng](docs/database-relationships.md).

### Bước 4 — Thiết lập Firebase

1. Vào [Firebase Console](https://console.firebase.google.com/) và tạo project.
2. Trong **Project settings**, thêm ứng dụng **Web**. Lưu các giá trị `apiKey`, `authDomain`, `projectId`, `appId` trong cấu hình Firebase.
3. Vào **Authentication → Sign-in method**, bật **Email/Password**.
4. Trong **Authentication → Settings → Authorized domains**, kiểm tra và thêm `localhost` nếu chưa có.
5. Vào **Project settings → Service accounts**, tạo private key cho Firebase Admin SDK. File JSON tải về chứa `project_id`, `client_email` và `private_key` cần dùng ở bước tiếp theo.

Firebase Web và Firebase Admin phải thuộc **cùng project**. Giữ riêng file service-account JSON và private key, không đưa vào Git.

### Bước 5 — Cấu hình biến môi trường

Sao chép [.env.example](.env.example) thành `.env.local` tại thư mục gốc dự án.

Với PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Với macOS/Linux:

```bash
cp .env.example .env.local
```

Điền cấu hình PostgreSQL local:

```dotenv
PGHOST=localhost
PGPORT=5432
PGDATABASE=shop_app
PGUSER=postgres
PGPASSWORD=your-postgres-password
```

Thay `PGUSER` và `PGPASSWORD` bằng tài khoản PostgreSQL của bạn. `PGUSER` là tên role đăng nhập database, không phải tên server hiển thị trong pgAdmin. Nếu PostgreSQL dùng cổng khác, thay `PGPORT` tương ứng.

Điền cấu hình Firebase theo bảng đối chiếu:

| Biến trong `.env.local`            | Giá trị lấy từ Firebase              |
| ---------------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_FIREBASE_API_KEY`     | Web config: `apiKey`                 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Web config: `authDomain`             |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`  | Web config: `projectId`              |
| `NEXT_PUBLIC_FIREBASE_APP_ID`      | Web config: `appId`                  |
| `FIREBASE_ADMIN_PROJECT_ID`        | Service-account JSON: `project_id`   |
| `FIREBASE_ADMIN_CLIENT_EMAIL`      | Service-account JSON: `client_email` |
| `FIREBASE_ADMIN_PRIVATE_KEY`       | Service-account JSON: `private_key`  |

Trong `.env.local`, private key đặt trong dấu nháy kép trên một dòng, với ký tự xuống dòng viết thành `\n`, theo mẫu trong `.env.example`.

Chỉ cấu hình Firebase Web dùng tiền tố `NEXT_PUBLIC_`. Các biến kết nối database và Firebase Admin chỉ dùng trên server. `.env.local` đã được bỏ qua bởi Git.

### Bước 6 — Chạy và kiểm tra

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) và kiểm tra:

1. Trang chủ và `/shop` hiển thị sản phẩm mẫu.
2. `/test-db` đọc được sản phẩm `p1` qua API.
3. Đăng ký tài khoản tại `/signup`, kiểm tra đăng nhập và đăng xuất.
4. Thêm sản phẩm vào giỏ, nhập thông tin giao hàng và đặt đơn thử; xem kết quả tại `/orders`.

Khi thay đổi `.env.local`, dừng dev server bằng **Ctrl+C** rồi chạy lại `npm run dev`.

### Bước 7 — Cấp quyền admin để thử trang quản trị

Đăng ký và đăng nhập tài khoản bằng giao diện để hồ sơ được đồng bộ vào bảng `users`. Trong Query Tool của database `shop_app`, thay email mẫu rồi chạy:

```sql
-- Cấp quyền admin cho hồ sơ đã được Firebase xác thực và đồng bộ.
UPDATE public.users
SET role = 'admin', updated_at = CURRENT_TIMESTAMP
WHERE email = 'your-admin@example.com'
  AND firebase_uid IS NOT NULL
  AND is_active = true;
```

Đăng xuất rồi đăng nhập lại. Tài khoản admin sẽ được chuyển tới `/admin`. Nếu câu lệnh cập nhật 0 dòng, kiểm tra email và việc đồng bộ hồ sơ vào database.

Dự án không có sẵn tài khoản `admin/1234`. Dùng tài khoản khách hàng riêng để thử luồng mua sắm, vì nút giỏ hàng và thêm vào giỏ bị vô hiệu hóa trên giao diện của admin.

### Các lệnh kiểm tra và chạy bản build

| Lệnh                                                 | Mục đích                                           |
| ---------------------------------------------------- | -------------------------------------------------- |
| `npm run dev`                                        | Chạy server phát triển                             |
| `npm run lint`                                       | Kiểm tra quy tắc mã nguồn bằng ESLint              |
| `npx tsc --noEmit`                                   | Kiểm tra kiểu TypeScript                           |
| `npm run build`                                      | Tạo bản build production                           |
| `npm run start`                                      | Chạy bản production local sau khi build thành công |
| `node --env-file=.env.local --test tests/*.test.mjs` | Chạy bộ kiểm thử                                   |

Các kiểm thử PostgreSQL cần kết nối database hợp lệ; kiểm thử nghiệp vụ dùng bảng tạm trên connection riêng, không sửa dữ liệu shop trong các bảng chính.
