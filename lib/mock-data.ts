// lib/mock-data.ts

export type Size = "S" | "M" | "L" | "XL" | "XXL";

export interface ProductVariant {
  id: string;
  size: Size;
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
  soldCount: number; // dùng tạm cho "Top Seller" trước khi có Order thật
  createdAt: string; // ISO date string, ví dụ "2026-09-01"
}

export interface Category {
  id: string;
  name: string;
}

export interface Style {
  id: string;
  name: string;
}

export const categories: Category[] = [
  { id: "cat-tshirt", name: "T-shirts" },
  { id: "cat-shorts", name: "Shorts" },
  { id: "cat-shirt", name: "Shirts" },
  { id: "cat-hoodie", name: "Hoodie" },
  { id: "cat-jeans", name: "Jeans" },
];

export const styles: Style[] = [
  { id: "style-casual", name: "Casual" },
  { id: "style-formal", name: "Formal" },
  { id: "style-party", name: "Party" },
  { id: "style-gym", name: "Gym" },
];

const allSizes: Size[] = ["S", "M", "L", "XL", "XXL"];

function genVariants(stocks: number[]): ProductVariant[] {
  return allSizes.map((size, i) => ({
    id: `${size}-${Math.random().toString(36).slice(2, 8)}`,
    size,
    stock: stocks[i] ?? 0,
  }));
}

export const products: Product[] = [
  {
    id: "p1",
    name: "Basic Cotton T-shirt",
    originalPrice: 189000,
    description:
      "Áo thun cotton form regular, chất liệu thoáng mát, phù hợp mặc hằng ngày.",
    images: [
      "https://picsum.photos/seed/p1a/600/800",
      "https://picsum.photos/seed/p1b/600/800",
    ],
    categoryId: "cat-tshirt",
    styleIds: ["style-casual", "style-gym"],
    variants: genVariants([10, 25, 15, 5, 0]),
    soldCount: 152,
    createdAt: "2026-08-01",
  },
  {
    id: "p2",
    name: "Slim Fit Dress Shirt",
    originalPrice: 349000,
    description:
      "Sơ mi form slim, vải không nhăn, phù hợp đi làm hoặc dự tiệc.",
    images: [
      "https://picsum.photos/seed/p2a/600/800",
      "https://picsum.photos/seed/p2b/600/800",
    ],
    categoryId: "cat-shirt",
    styleIds: ["style-formal", "style-party"],
    variants: genVariants([8, 12, 10, 6, 2]),
    soldCount: 98,
    createdAt: "2026-08-02",
  },
  {
    id: "p3",
    name: "Oversized Hoodie",
    originalPrice: 429000,
    description: "Hoodie form rộng, nỉ bông dày dặn, giữ ấm tốt.",
    images: [
      "https://picsum.photos/seed/p3a/600/800",
      "https://picsum.photos/seed/p3b/600/800",
    ],
    categoryId: "cat-hoodie",
    styleIds: ["style-casual"],
    variants: genVariants([5, 20, 18, 10, 4]),
    soldCount: 210,
    createdAt: "2026-08-03",
  },
  {
    id: "p4",
    name: "Slim Jeans",
    originalPrice: 459000,
    description: "Quần jeans form slim, co giãn nhẹ, dễ phối đồ.",
    images: [
      "https://picsum.photos/seed/p4a/600/800",
      "https://picsum.photos/seed/p4b/600/800",
    ],
    categoryId: "cat-jeans",
    styleIds: ["style-casual", "style-formal"],
    variants: genVariants([6, 14, 16, 8, 0]),
    soldCount: 134,
    createdAt: "2026-05-01",
  },
  {
    id: "p5",
    name: "Gym Performance Shorts",
    originalPrice: 229000,
    description: "Quần short tập gym, vải co giãn 4 chiều, thấm hút mồ hôi.",
    images: [
      "https://picsum.photos/seed/p5a/600/800",
      "https://picsum.photos/seed/p5b/600/800",
    ],
    categoryId: "cat-shorts",
    styleIds: ["style-gym"],
    variants: genVariants([12, 18, 14, 7, 3]),
    soldCount: 87,
    createdAt: "2026-08-12",
  },
  {
    id: "p6",
    name: "Party Print Shirt",
    originalPrice: 389000,
    description:
      "Sơ mi hoạ tiết, chất liệu lụa mềm, nổi bật trong các buổi tiệc.",
    images: [
      "https://picsum.photos/seed/p6a/600/800",
      "https://picsum.photos/seed/p6b/600/800",
    ],
    categoryId: "cat-shirt",
    styleIds: ["style-party"],
    variants: genVariants([4, 10, 9, 5, 1]),
    soldCount: 56,
    createdAt: "2026-02-01",
  },
  {
    id: "p7",
    name: "Casual Graphic Tee",
    originalPrice: 199000,
    description: "Áo thun in hình, chất liệu cotton 100%, form regular.",
    images: [
      "https://picsum.photos/seed/p7a/600/800",
      "https://picsum.photos/seed/p7b/600/800",
    ],
    categoryId: "cat-tshirt",
    styleIds: ["style-casual"],
    variants: genVariants([15, 22, 20, 9, 5]),
    soldCount: 178,
    createdAt: "2026-01-14",
  },
  {
    id: "p8",
    name: "Formal Slacks",
    originalPrice: 399000,
    description: "Quần tây form slim, vải cao cấp, phù hợp đi làm.",
    images: [
      "https://picsum.photos/seed/p8a/600/800",
      "https://picsum.photos/seed/p8b/600/800",
    ],
    categoryId: "cat-jeans",
    styleIds: ["style-formal"],
    variants: genVariants([7, 13, 11, 6, 2]),
    soldCount: 62,
    createdAt: "2026-05-20",
  },
  {
    id: "p9",
    name: "Oversized Cotton Tee",
    originalPrice: 250000,
    salePrice: 200000,
    description: "Áo thun cotton form rộng, mềm mại, dễ phối đồ hằng ngày.",
    images: [
      "https://picsum.photos/seed/p9a/600/800",
      "https://picsum.photos/seed/p9b/600/800",
    ],
    categoryId: "cat-tshirt",
    styleIds: ["style-casual"],
    variants: genVariants([12, 20, 18, 8, 3]),
    soldCount: 120,
    createdAt: "2026-09-01",
  },
  {
    id: "p10",
    name: "Classic Oxford Shirt",
    originalPrice: 400000,
    salePrice: 300000,
    description:
      "Sơ mi Oxford cổ điển, form regular, phù hợp đi làm và gặp gỡ.",
    images: [
      "https://picsum.photos/seed/p10a/600/800",
      "https://picsum.photos/seed/p10b/600/800",
    ],
    categoryId: "cat-shirt",
    styleIds: ["style-formal", "style-casual"],
    variants: genVariants([6, 15, 14, 7, 2]),
    soldCount: 85,
    createdAt: "2026-09-03",
  },
  {
    id: "p11",
    name: "Zip-Up Fleece Hoodie",
    originalPrice: 500000,
    salePrice: 350000,
    description: "Hoodie khóa kéo, lớp nỉ mềm giữ ấm, tiện mặc khi ra ngoài.",
    images: [
      "https://picsum.photos/seed/p11a/600/800",
      "https://picsum.photos/seed/p11b/600/800",
    ],
    categoryId: "cat-hoodie",
    styleIds: ["style-casual", "style-gym"],
    variants: genVariants([5, 16, 12, 6, 1]),
    soldCount: 165,
    createdAt: "2026-09-05",
  },
  {
    id: "p12",
    name: "Straight Fit Denim Jeans",
    originalPrice: 600000,
    salePrice: 360000,
    description:
      "Quần jeans ống đứng, denim bền đẹp, phù hợp nhiều phong cách.",
    images: [
      "https://picsum.photos/seed/p12a/600/800",
      "https://picsum.photos/seed/p12b/600/800",
    ],
    categoryId: "cat-jeans",
    styleIds: ["style-casual", "style-party"],
    variants: genVariants([8, 14, 15, 9, 3]),
    soldCount: 142,
    createdAt: "2026-09-07",
  },
  {
    id: "p13",
    name: "Lightweight Training Shorts",
    originalPrice: 300000,
    salePrice: 150000,
    description: "Quần short thể thao nhẹ, nhanh khô, thoải mái khi vận động.",
    images: [
      "https://picsum.photos/seed/p13a/600/800",
      "https://picsum.photos/seed/p13b/600/800",
    ],
    categoryId: "cat-shorts",
    styleIds: ["style-gym", "style-casual"],
    variants: genVariants([10, 18, 16, 8, 4]),
    soldCount: 105,
    createdAt: "2026-09-09",
  },
];

export function getNewArrivals(count = 4): Product[] {
  return [...products]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, count);
}

// Helper: sản phẩm bán chạy nhất
export function getTopSellers(count = 4): Product[] {
  return [...products]
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, count);
}

export function getCategoryById(id: string) {
  return categories.find((c) => c.id === id);
}

export function getStylesByIds(ids: string[]) {
  return styles.filter((s) => ids.includes(s.id));
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
