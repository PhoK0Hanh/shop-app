import { getCategories, getStyles } from "@/lib/products";
import { catalogResponse } from "@/lib/catalog-api";

// Đọc các lựa chọn cho navbar và bộ lọc trong một request.
export async function GET() {
  return catalogResponse(async () => {
    const [categories, styles] = await Promise.all([getCategories(), getStyles()]);
    return { categories, styles };
  });
}
