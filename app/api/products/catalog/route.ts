import { getProducts } from "@/lib/products";
import { catalogResponse } from "@/lib/catalog-api";

// Catalog đang bán để giỏ khách tra giá/tồn kho từ API thay cho mock-data.
export async function GET() { return catalogResponse(getProducts); }
