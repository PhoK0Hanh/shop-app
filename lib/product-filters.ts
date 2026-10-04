import type { Category, Product, Size, Style } from "./mock-data";

export interface ProductFilters {
  categoryId: string | null;
  styleIds: string[];
  size: Size | null;
  priceRange: [number, number];
}

export const minFilterPrice = 0;
export const maxFilterPrice = 1000000;

export function createDefaultFilters(): ProductFilters {
  return {
    categoryId: null,
    styleIds: [],
    size: null,
    priceRange: [minFilterPrice, maxFilterPrice],
  };
}

export function parseFilterQuery(query: string, categories: Category[], styles: Style[]): ProductFilters {
  const params = new URLSearchParams(query);
  const filters = createDefaultFilters();
  const category = params.get("category");
  filters.categoryId = categories.find((item) => item.id.replace(/^cat-/, "") === category)?.id ?? null;
  const styleSlugs = params.getAll("style").flatMap((value) => value.split(","));
  filters.styleIds = styles.filter((item) => styleSlugs.includes(item.id.replace(/^style-/, ""))).map((item) => item.id);
  const size = params.get("size")?.toUpperCase();
  if (size && ["S", "M", "L", "XL", "XXL"].includes(size)) filters.size = size as Size;

  function readPrice(key: string, fallback: number) {
    const raw = params.get(key);
    if (!raw?.trim()) return fallback;
    const price = Number(raw);
    return Number.isFinite(price) ? Math.min(maxFilterPrice, Math.max(minFilterPrice, price)) : fallback;
  }
  const min = readPrice("minPrice", minFilterPrice);
  const max = readPrice("maxPrice", maxFilterPrice);
  filters.priceRange = min <= max ? [min, max] : [minFilterPrice, maxFilterPrice];
  return filters;
}

export function serializeFilterQuery(filters: ProductFilters, currentQuery = ""): string {
  const params = new URLSearchParams(currentQuery);
  for (const key of ["category", "style", "size", "minPrice", "maxPrice", "page"]) params.delete(key);
  if (filters.categoryId) params.set("category", filters.categoryId.replace(/^cat-/, ""));
  for (const id of filters.styleIds) params.append("style", id.replace(/^style-/, ""));
  if (filters.size) params.set("size", filters.size);
  if (filters.priceRange[0] !== minFilterPrice) params.set("minPrice", String(filters.priceRange[0]));
  if (filters.priceRange[1] !== maxFilterPrice) params.set("maxPrice", String(filters.priceRange[1]));
  return params.toString();
}

export function getSellingPrice(product: Product): number {
  return product.salePrice !== undefined &&
    product.salePrice >= 0 &&
    product.salePrice < product.originalPrice
    ? product.salePrice
    : product.originalPrice;
}

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  return products.filter((product) => {
    const price = getSellingPrice(product);
    return (
      (!filters.categoryId || product.categoryId === filters.categoryId) &&
      price >= filters.priceRange[0] && price <= filters.priceRange[1] &&
      (filters.styleIds.length === 0 || filters.styleIds.some((id) => product.styleIds.includes(id))) &&
      (!filters.size || product.variants.some((variant) => variant.size === filters.size && variant.stock > 0))
    );
  });
}
