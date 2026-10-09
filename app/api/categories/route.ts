import { getCategories } from "@/lib/products";
import { catalogResponse } from "@/lib/catalog-api";

// Danh sách category lấy từ PostgreSQL.
export async function GET() { return catalogResponse(getCategories); }
