"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { formatPrice, getDiscountPercent } from "@/lib/catalog";
import type { Color, Product, Size } from "@/lib/catalog";
import { getColorLabel } from "@/lib/catalog-labels";

const colorHex: Record<Color, string> = {
  Black: "#000000",
  White: "#FFFFFF",
  Gray: "#808080",
  Navy: "#1E3A5F",
  Blue: "#2563EB",
  Beige: "#D9C5A1",
  Green: "#3F6B45",
  Burgundy: "#800020",
};

export default function ProductInfo({ product }: { product: Product }) {
  // Đợi catalog API sẵn sàng trước khi thêm biến thể vào giỏ khách.
  const { addItem, ready, canPurchase } = useCart();
  const [cartMessage, setCartMessage] = useState("");
  const colors = [...new Set(product.variants.map((variant) => variant.color))];
  const [selectedColor, setSelectedColor] = useState<Color | null>(
    product.variants.find((variant) => variant.stock > 0)?.color ??
      colors[0] ??
      null,
  );
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [quantity, setQuantity] = useState(1);
  const colorVariants = product.variants.filter(
    (variant) => variant.color === selectedColor,
  );
  const selectedVariant = colorVariants.find(
    (variant) => variant.size === selectedSize,
  );
  const availableStock = selectedVariant?.stock ?? 0;
  const canAddToCart =
    ready && canPurchase && availableStock > 0 && quantity >= 1 && quantity <= availableStock;

  const discount = getDiscountPercent(product.originalPrice, product.salePrice);

  const sellingPrice =
    discount !== null ? product.salePrice! : product.originalPrice;

  return (
    <div className="min-w-0 flex-1 space-y-6">
      {/* Tên sản phẩm */}
      <h1 className="text-3xl font-bold lg:text-4xl">{product.name}</h1>

      {/* Giá */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-2xl font-bold text-black">
          {formatPrice(sellingPrice)}
        </span>

        {discount !== null && (
          <>
            <del className="text-2xl font-bold text-gray-400">
              {formatPrice(product.originalPrice)}
            </del>

            <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-600">
              -{discount}%
            </span>
          </>
        )}
      </div>

      {/* Chọn màu */}
      <div className="border-t pt-5">
        <h2 className="mb-3 font-medium">Chọn màu</h2>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => {
            const isSelected = selectedColor === color;
            const isSoldOut = !product.variants.some(
              (variant) => variant.color === color && variant.stock > 0,
            );
            return (
              <button
                key={color}
                type="button"
                title={getColorLabel(color)}
                style={{ backgroundColor: colorHex[color] }}
                disabled={isSoldOut}
                onClick={() => {
                  if (color !== selectedColor) {
                    setSelectedColor(color);
                    setSelectedSize(null);
                    setQuantity(1);
                  }
                }}
                className={`size-10 shrink-0 rounded-full border transition-shadow disabled:cursor-not-allowed disabled:opacity-30 ${
                  isSelected
                    ? "border-black ring-2 ring-black ring-offset-2"
                    : "border-gray-300"
                }`}
              >
                <span className="sr-only">{getColorLabel(color)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chọn kích cỡ */}
      <div className="border-t pt-5">
        <h2 className="mb-3 font-medium">Chọn kích cỡ</h2>

        <div className="flex flex-wrap gap-2">
          {colorVariants.map((variant) => {
            const isSelected = selectedSize === variant.size;
            const isSoldOut = variant.stock <= 0;

            return (
              <button
                key={variant.id}
                type="button"
                disabled={isSoldOut}
                onClick={() => {
                  if (variant.size !== selectedSize) {
                    setSelectedSize(variant.size);
                    setQuantity(1);
                  }
                }}
                className={`rounded-full border px-5 py-3
                  disabled:cursor-not-allowed disabled:opacity-30 ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-black"
                  }`}
              >
                {variant.size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chọn số lượng */}
      <div className="border-t pt-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex shrink-0 items-center gap-1 sm:gap-4 rounded-full bg-gray-100 px-2 py-1">
            <button
              type="button"
              title="Giảm số lượng"
              disabled={quantity <= 1}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              className="size-10 rounded-full text-xl hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
            >
              −
            </button>
            <span className="min-w-6 text-center font-medium">{quantity}</span>
            <button
              type="button"
              title="Tăng số lượng"
              disabled={!selectedVariant || quantity >= availableStock}
              onClick={() =>
                setQuantity((current) => Math.min(availableStock, current + 1))
              }
              className="size-10 rounded-full text-xl hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
            >
              +
            </button>
          </div>
          <button
            type="button"
            disabled={!canAddToCart}
            onClick={() => {
              if (!selectedVariant || !canPurchase) return;
              // Thêm theo biến thể đang chọn và báo số lượng thực tế được thêm.
              const added = addItem(selectedVariant.id, quantity);
              setCartMessage(added > 0
                ? `Đã thêm ${added} sản phẩm (${getColorLabel(selectedVariant.color)}, ${selectedVariant.size}) vào giỏ hàng.${added < quantity ? " Đã đạt giới hạn tồn kho." : ""}`
                : "Biến thể này đã đạt giới hạn tồn kho trong giỏ hàng.");
            }}
            className="h-12 min-w-0 flex-1 rounded-full bg-black px-3 text-sm font-medium text-white hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 sm:text-base"
          >
            Thêm vào giỏ hàng
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {selectedVariant
            ? `${availableStock} sản phẩm có sẵn`
            : "Chọn kích cỡ để thay đổi số lượng."}
        </p>
        {cartMessage && <div className="mt-3 rounded-xl bg-gray-100 p-3 text-sm"><p>{cartMessage}</p><Link href="/cart" className="mt-1 inline-block font-semibold underline">Xem giỏ hàng</Link></div>}
      </div>
    </div>
  );
}
