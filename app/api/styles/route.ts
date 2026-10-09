import { getStyles } from "@/lib/products";
import { catalogResponse } from "@/lib/catalog-api";

// Danh sách style lấy từ PostgreSQL.
export async function GET() { return catalogResponse(getStyles); }
