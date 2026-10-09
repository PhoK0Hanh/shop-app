"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import ApiStatus from "@/components/ApiStatus";
import { formatPrice, getDiscountPercent } from "@/lib/catalog";

export default function CartContent() {
  // API lỗi không được hiển thị nhầm thành giỏ trống hoặc xóa dữ liệu đã lưu.
  const { items, ready, error, retry, findCartVariant, totalQuantity, updateQuantity, removeItem, clearCart } = useCart();
  const lines = items.flatMap((item) => {
    const match = findCartVariant(item.variantId);
    if (!match) return [];
    const discount = getDiscountPercent(match.product.originalPrice, match.product.salePrice);
    const price = discount !== null ? match.product.salePrice! : match.product.originalPrice;
    return [{ ...item, ...match, price, discount }];
  });
  // Tính giá từ dữ liệu sản phẩm hiện tại, không tin giá được lưu trong localStorage.
  const subtotal = lines.reduce((sum, line) => sum + line.product.originalPrice * line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  if (!ready) return <ApiStatus error={error} retry={retry} />;
  if (lines.length === 0) return (
    <div className="rounded-3xl border border-gray-200 px-6 py-16 text-center">
      <ShoppingBag size={48} className="mx-auto mb-5 text-gray-400" />
      <h2 className="text-2xl font-bold">Giỏ hàng của bạn đang trống</h2>
      <p className="mt-3 text-gray-500">Khám phá sản phẩm và chọn phong cách của bạn.</p>
      <Link href="/shop" className="mt-7 inline-flex rounded-full bg-black px-8 py-3 font-medium text-white transition-colors hover:bg-[#383838]">Tiếp tục mua sắm</Link>
    </div>
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className="min-w-0 rounded-3xl border border-gray-200 p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Sản phẩm ({totalQuantity})</h2>
          <button type="button" onClick={clearCart} className="text-sm text-gray-500 hover:text-red-600">Xóa tất cả</button>
        </div>
        <div className="divide-y divide-gray-200">
          {lines.map((line, index) => (
            <article key={line.variantId} className="flex gap-3 py-5 first:pt-0 last:pb-0 sm:gap-5">
              <Link href={`/product/${line.product.id}`} className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-[#F2F0F1] sm:size-32">
                <Image src={line.product.images[0]} alt={line.product.name} fill sizes="(min-width: 640px) 128px, 96px" loading={index === 0 ? "eager" : "lazy"} className="object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/product/${line.product.id}`} className="min-w-0 font-bold wrap-break-word hover:underline sm:text-lg">{line.product.name}</Link>
                  <button type="button" title="Xóa sản phẩm" onClick={() => removeItem(line.variantId)} className="shrink-0 rounded-lg p-1 text-red-500 hover:bg-red-50"><Trash2 size={20} /></button>
                </div>
                <p className="mt-1 text-sm text-gray-500">Size: <span className="text-black">{line.variant.size}</span> · Màu: <span className="text-black">{line.variant.color}</span></p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="font-bold sm:text-lg">{formatPrice(line.price)}</span>
                  {line.discount !== null && <><del className="text-sm text-gray-400">{formatPrice(line.product.originalPrice)}</del><span className="text-xs text-red-500">-{line.discount}%</span></>}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-3 rounded-full bg-gray-100 px-2 py-1">
                    <button type="button" title="Giảm số lượng" disabled={line.quantity <= 1} onClick={() => updateQuantity(line.variantId, line.quantity - 1)} className="flex size-8 items-center justify-center rounded-full hover:bg-gray-200 disabled:opacity-30"><Minus size={16} /></button>
                    <span className="min-w-5 text-center text-sm font-medium">{line.quantity}</span>
                    <button type="button" title="Tăng số lượng" disabled={line.quantity >= line.variant.stock} onClick={() => updateQuantity(line.variantId, line.quantity + 1)} className="flex size-8 items-center justify-center rounded-full hover:bg-gray-200 disabled:opacity-30"><Plus size={16} /></button>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(line.price * line.quantity)}</span>
                </div>
                {line.quantity >= line.variant.stock && <p className="mt-2 text-xs text-gray-500">Đã đạt số lượng tồn kho.</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
      <aside className="rounded-3xl border border-gray-200 p-6">
        <h2 className="mb-6 text-xl font-bold">Tổng giỏ hàng</h2>
        <dl className="space-y-4">
          <div className="flex justify-between gap-4"><dt className="text-gray-500">Tổng giá gốc</dt><dd className="font-semibold">{formatPrice(subtotal)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-gray-500">Giảm giá</dt><dd className="font-semibold text-red-500">-{formatPrice(subtotal - total)}</dd></div>
          <div className="flex justify-between gap-4 border-t border-gray-200 pt-4 text-lg"><dt className="font-medium">Tổng tiền sản phẩm</dt><dd className="font-bold">{formatPrice(total)}</dd></div>
        </dl>
        <p className="mt-4 text-sm text-gray-500">Chưa bao gồm phí vận chuyển.</p>
        {/* Checkout sẽ được kết nối khi có chức năng tạo đơn hàng. */}
        <button type="button" disabled className="mt-6 h-12 w-full cursor-not-allowed rounded-full bg-black font-medium text-white opacity-40">Thanh toán</button>
        <p className="mt-2 text-center text-xs text-gray-500">Chức năng thanh toán đang được phát triển.</p>
        <Link href="/shop" className="mt-5 block text-center text-sm font-medium underline underline-offset-4">Tiếp tục mua sắm</Link>
      </aside>
    </div>
  );
}
