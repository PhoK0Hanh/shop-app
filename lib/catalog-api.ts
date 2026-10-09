import "server-only";
import { NextResponse } from "next/server";

// Các GET catalog luôn trả JSON; không lộ chi tiết lỗi kết nối PostgreSQL.
export async function catalogResponse<T>(read: () => Promise<T>) {
  try {
    return NextResponse.json(await read(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Không tải được dữ liệu danh mục." }, {
      status: 500, headers: { "Cache-Control": "no-store" },
    });
  }
}
