import { products } from "./mock-data";

export interface CartItem {
  variantId: string;
  quantity: number;
}

export function findCartVariant(variantId: string) {
  const product = products.find((item) => item.variants.some((variant) => variant.id === variantId));
  const variant = product?.variants.find((item) => item.id === variantId);
  return product && variant ? { product, variant } : null;
}

// Dữ liệu lưu trên trình duyệt phải được kiểm tra lại và giới hạn theo tồn kho hiện tại.
export function normalizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const quantities = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item.variantId !== "string" || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) continue;
    const match = findCartVariant(item.variantId);
    if (!match || match.variant.stock <= 0) continue;
    quantities.set(item.variantId, Math.min(match.variant.stock, (quantities.get(item.variantId) ?? 0) + item.quantity));
  }
  return Array.from(quantities, ([variantId, quantity]) => ({ variantId, quantity }));
}

export function readCart(raw: string): CartItem[] {
  try {
    return normalizeCart(JSON.parse(raw));
  } catch {
    return [];
  }
}
