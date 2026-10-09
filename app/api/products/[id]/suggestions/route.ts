import { NextResponse } from "next/server";
import { getProductById, getSuggestedProducts } from "@/lib/products";

// ID sản phẩm quyết định category gợi ý, client không cần gửi category riêng.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) return NextResponse.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
    return NextResponse.json(await getSuggestedProducts(product.categoryId, id), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Không tải được gợi ý." }, { status: 500 });
  }
}
