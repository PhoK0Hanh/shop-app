// Model và helper dùng chung cho JSON API; không chứa dữ liệu mẫu.
export type Size = "S" | "M" | "L" | "XL" | "XXL";
export type Color = "Black" | "White" | "Gray" | "Navy" | "Blue" | "Beige" | "Green" | "Burgundy";

export interface ProductVariant {
  id: string;
  size: Size;
  color: Color;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  originalPrice: number; // Giá gốc, VND
  salePrice?: number; // Giá sau giảm, VND; chỉ có khi thấp hơn originalPrice
  description: string;
  images: string[];
  categoryId: string;
  styleIds: string[];
  variants: ProductVariant[];
  soldCount: number; // Số lượt bán dùng để sắp xếp danh sách bán chạy.
  createdAt: string; // ISO date string, ví dụ "2026-09-01"
}

export interface Category {
  id: string;
  name: string;
  slug: string; // Giá trị dùng trong URL, độc lập với ID.
}

export interface Style {
  id: string;
  name: string;
  slug: string;
}

export function getDiscountPercent(
  originalPrice: number,
  salePrice?: number,
): number | null {
  if (
    salePrice === undefined ||
    originalPrice <= 0 ||
    salePrice < 0 ||
    salePrice >= originalPrice
  ) {
    return null;
  }

  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}
