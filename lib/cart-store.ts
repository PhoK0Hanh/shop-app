"use client";

import { useMemo, useSyncExternalStore } from "react";
import { findCartVariant, normalizeCart, readCart } from "./cart";
import type { CartItem } from "./cart";
import type { Product } from "./catalog";
import { useApi } from "./use-api";
import { usePurchasePermission } from "./use-purchase-permission";

const storageKey = "shop-app-cart-v1";
let memorySnapshot = "[]";
let useMemoryOnly = false;
const listeners = new Set<() => void>();

function getSnapshot() {
  if (useMemoryOnly) return memorySnapshot;
  try {
    return window.localStorage.getItem(storageKey) ?? memorySnapshot;
  } catch {
    return memorySnapshot;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) {
      memorySnapshot = "[]";
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function saveCart(items: CartItem[], products: Product[]) {
  memorySnapshot = JSON.stringify(normalizeCart(items, products));
  try {
    window.localStorage.setItem(storageKey, memorySnapshot);
  } catch {
    // Nếu trình duyệt chặn lưu trữ, giỏ hàng vẫn hoạt động trong phiên hiện tại.
    useMemoryOnly = true;
  }
  listeners.forEach((listener) => listener());
}

export function useCart() {
  const permission = usePurchasePermission();
  // Giỏ khách vẫn lưu lựa chọn cục bộ; giá và tồn kho được tải từ PostgreSQL qua API.
  const catalog = useApi<Product[]>("/products/catalog");
  // Snapshot server luôn rỗng để HTML ban đầu khớp; React đọc localStorage sau hydration.
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const ready = hydrated && Boolean(catalog.data);
  const products = catalog.data;
  const items = useMemo(() => readCart(snapshot, products ?? []), [snapshot, products]);

  function addItem(variantId: string, quantity: number) {
    if (!products || !ready) return 0;
    const match = findCartVariant(variantId, products);
    if (!match || !Number.isSafeInteger(quantity) || quantity <= 0) return 0;
    const current = readCart(getSnapshot(), products);
    const existing = current.find((item) => item.variantId === variantId);
    const added = Math.max(0, Math.min(quantity, match.variant.stock - (existing?.quantity ?? 0)));
    if (added === 0) return 0;
    // Cùng variantId thì cộng số lượng; khác màu hoặc size tạo một dòng riêng.
    saveCart(existing
      ? current.map((item) => item.variantId === variantId ? { ...item, quantity: item.quantity + added } : item)
      : [...current, { variantId, quantity: added }], products);
    return added;
  }

  function updateQuantity(variantId: string, quantity: number) {
    if (!products || !Number.isSafeInteger(quantity) || quantity < 1) return;
    saveCart(readCart(getSnapshot(), products).map((item) => item.variantId === variantId ? { ...item, quantity } : item), products);
  }

  function removeItem(variantId: string) {
    if (products) saveCart(readCart(getSnapshot(), products).filter((item) => item.variantId !== variantId), products);
  }

  // Trừ phần đã tạo đơn khỏi snapshot mới nhất, giữ thay đổi giỏ trong lúc chờ API.
  function consumeItems(purchased: CartItem[]) {
    if (!products) return;
    saveCart(readCart(getSnapshot(), products).map((item) => ({ ...item,
      quantity: item.quantity - (purchased.find((line) => line.variantId === item.variantId)?.quantity ?? 0),
    })).filter((item) => item.quantity > 0), products);
  }

  return { items, ready, ...permission, error: catalog.error, retry: catalog.retry,
    findCartVariant: (id: string) => findCartVariant(id, products ?? []),
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0), addItem, updateQuantity, removeItem, consumeItems,
    clearCart: () => { if (products) saveCart([], products); } };
}
