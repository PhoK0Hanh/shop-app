import { getShopProducts } from "@/lib/products";
import { catalogResponse } from "@/lib/catalog-api";
import { createDefaultFilters } from "@/lib/product-filters";

// Hai nhóm trang chủ dùng sort SQL; không áp giới hạn slider giá của shop.
export async function GET() {
  return catalogResponse(async () => {
    const filters = { ...createDefaultFilters(), priceRange: [0, 2147483647] as [number, number] };
    const [newest, best] = await Promise.all([
      getShopProducts(filters, "newest", 1), getShopProducts(filters, "bestselling", 1),
    ]);
    return { newArrivals: newest.products.slice(0, 4), topSellers: best.products.slice(0, 4) };
  });
}
