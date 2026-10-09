import { NextResponse } from "next/server";
import { getProductById, getCategoryById } from "@/lib/products";

// Trả chi tiết và category cho breadcrumb; sản phẩm ngừng bán trả HTTP 404.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) return NextResponse.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
    const category = await getCategoryById(product.categoryId);
    return NextResponse.json({ product, category }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Không tải được sản phẩm." }, { status: 500 });
  }
}
