import type { Product } from "./catalog";

export const shopPageSize = 9;
export const shopSortOrders = ["newest", "oldest", "price-asc", "price-desc", "name", "bestselling"] as const;
export type ShopSortOrder = (typeof shopSortOrders)[number];

export interface ShopPageData {
  products: Product[];
  total: number;
  page: number;
  pageCount: number;
  sort: ShopSortOrder;
}

// Chỉ chấp nhận sort trong danh sách và số trang nguyên dương từ URL.
export function parseShopQuery(query: string): { sort: ShopSortOrder; page: number } {
  const params = new URLSearchParams(query);
  const sort = params.get("sort");
  const rawPage = params.get("page");
  const page = rawPage && /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  return {
    sort: shopSortOrders.find((item) => item === sort) ?? "newest",
    page: Number.isSafeInteger(page) && page >= 1 ? page : 1,
  };
}
