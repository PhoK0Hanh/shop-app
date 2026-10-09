"use client";

// Trạng thái dùng chung cho các màn hình lấy dữ liệu qua API.
export default function ApiStatus({ error, retry }: { error?: string; retry?: () => void }) {
  return <div className="px-4 py-12 text-center text-gray-500">
    <p>{error || "Đang tải..."}</p>
    {error && retry && <button type="button" onClick={retry} className="mt-4 rounded-full bg-black px-6 py-2 text-white">Thử lại</button>}
  </div>;
}
