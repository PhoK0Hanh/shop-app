import type { Product, Size } from "./mock-data";

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
