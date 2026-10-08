import { getProductById } from "@/lib/products";
import { connection } from "next/server";

export default async function TestDbPage() {
  // Chờ truy cập trang; truy vấn chạy trong component server, không chạy ở cấp module.
  await connection();

  // Kiểm tra cả thông tin chung, ảnh, biến thể và các style đã ghép từ database.
  const product = await getProductById("p1");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Kiểm tra kết nối PostgreSQL</h1>
      {!product ? (
        <p>Kết nối thành công, nhưng chưa tìm thấy sản phẩm p1 đang được bán.</p>
      ) : (
        <>
          <p className="mb-4 text-green-700">Kết nối thành công, đã đọc được sản phẩm p1.</p>
          {/* Hiển thị đối tượng Product hoàn chỉnh để kiểm tra trước khi nối vào trang detail. */}
          <pre className="overflow-auto rounded-xl bg-gray-100 p-6">
            {JSON.stringify(product, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
