"use client";

import { useApi } from "@/lib/use-api";
import ApiStatus from "@/components/ApiStatus";
import type { Product } from "@/lib/catalog";

// Trang kiểm tra đọc thông tin sản phẩm qua API thay vì truy cập pool trực tiếp.
export default function TestDbPage() {
  const result = useApi<{product: Product}>("/products/p1");
  if (!result.data) return <ApiStatus error={result.error} retry={result.retry} />;
  return <div className="mx-auto max-w-7xl px-4 py-8"><h1 className="mb-4 text-2xl font-bold">Kiểm tra API sản phẩm</h1><pre className="overflow-auto rounded-xl bg-gray-100 p-6">{JSON.stringify(result.data.product, null, 2)}</pre></div>;
}
