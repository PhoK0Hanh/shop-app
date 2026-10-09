import { NextRequest } from "next/server";
import { getCategories, getShopProducts, getStyles } from "@/lib/products";
import { catalogResponse } from "@/lib/catalog-api";
import { parseFilterQuery } from "@/lib/product-filters";
import { parseShopQuery } from "@/lib/shop-query";

// Dùng chung parser URL và SQL hiện tại; server quyết định trang hợp lệ và thứ tự sort.
export async function GET(request: NextRequest) {
  return catalogResponse(async () => {
    const query = request.nextUrl.searchParams.toString();
    const [categories, styles] = await Promise.all([getCategories(), getStyles()]);
    const { sort, page } = parseShopQuery(query);
    return getShopProducts(parseFilterQuery(query, categories, styles), sort, page);
  });
}
