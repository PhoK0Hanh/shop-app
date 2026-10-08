"use client";

import { useMemo, useSyncExternalStore } from "react";
import { findCartVariant, normalizeCart, readCart } from "./cart";
import type { CartItem } from "./cart";

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

function saveCart(items: CartItem[]) {
  memorySnapshot = JSON.stringify(normalizeCart(items));
  try {
    window.localStorage.setItem(storageKey, memorySnapshot);
  } catch {
    // Nếu trình duyệt chặn lưu trữ, giỏ hàng vẫn hoạt động trong phiên hiện tại.
    useMemoryOnly = true;
  }
  listeners.forEach((listener) => listener());
}

export function useCart() {
  // Snapshot server luôn rỗng để HTML ban đầu khớp; React đọc localStorage sau hydration.
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const items = useMemo(() => readCart(snapshot), [snapshot]);

  function addItem(variantId: string, quantity: number) {
    const match = findCartVariant(variantId);
    if (!match || !Number.isSafeInteger(quantity) || quantity <= 0) return 0;
    const current = readCart(getSnapshot());
    const existing = current.find((item) => item.variantId === variantId);
    const added = Math.max(0, Math.min(quantity, match.variant.stock - (existing?.quantity ?? 0)));
    if (added === 0) return 0;
    // Cùng variantId thì cộng số lượng; khác màu hoặc size tạo một dòng riêng.
    saveCart(existing
      ? current.map((item) => item.variantId === variantId ? { ...item, quantity: item.quantity + added } : item)
      : [...current, { variantId, quantity: added }]);
    return added;
  }

  function updateQuantity(variantId: string, quantity: number) {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return;
    saveCart(readCart(getSnapshot()).map((item) => item.variantId === variantId ? { ...item, quantity } : item));
  }

  function removeItem(variantId: string) {
    saveCart(readCart(getSnapshot()).filter((item) => item.variantId !== variantId));
  }

  return { items, ready, totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0), addItem, updateQuantity, removeItem, clearCart: () => saveCart([]) };
}
