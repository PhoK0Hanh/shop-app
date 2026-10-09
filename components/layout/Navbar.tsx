"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, ChevronDown, TextAlignJustify, X } from "lucide-react";
import type { Category, Style } from "@/lib/catalog";
import { useApi } from "@/lib/use-api";
import { useCart } from "@/lib/cart-store";
import AccountMenu from "@/components/auth/AccountMenu";

export default function Navbar() {
  // Lựa chọn dropdown đọc từ API, dùng slug thực của database.
  const catalog = useApi<{categories: Category[]; styles: Style[]}>("/catalog");
  const categories = catalog.data?.categories ?? [];
  const styles = catalog.data?.styles ?? [];
  // Tổng số lượng được đồng bộ với trang chi tiết và giỏ hàng.
  const { totalQuantity, canPurchase } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <nav className="border-b bg-white text-black">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 md:h-20">
        <button
          type="button"
          title={menuOpen ? "Đóng menu" : "Mở menu"}
          onClick={() => setMenuOpen((current) => !current)}
          className="mr-2 flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 md:hidden"
        >
          {menuOpen ? <X size={24} /> : <TextAlignJustify size={24} />}
        </button>
        {/* 1. Logo bên trái */}
        <Link href="/" onClick={() => setMenuOpen(false)} className="shrink-0 text-[28px] font-bold leading-none tracking-tight md:text-4xl">
          SHOP.CO
        </Link>

        {/* 2. Menu giữa/phải — ẩn trên mobile */}
        <div className="ml-8 hidden items-center gap-6 whitespace-nowrap text-sm font-medium md:flex lg:ml-12 lg:gap-8 lg:text-base">
          <div
            className="relative flex items-center gap-1"
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
            onFocus={() => setShopOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setShopOpen(false);
            }}
            onClick={() => setShopOpen(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setShopOpen(false);
            }}
          >
            <Link href="/shop" className={`py-2 transition-colors duration-200 ${shopOpen ? "text-gray-500" : "text-black"}`}>
              Sản phẩm
            </Link>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${shopOpen ? "rotate-180" : "rotate-0"}`}
            />
            <div className={`absolute left-0 top-full z-50 w-80 pt-2 transition-opacity duration-200 lg:w-96 ${shopOpen ? "visible opacity-100" : "invisible opacity-0"}`}>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-black shadow-lg">
                <Link href="/shop" className="mb-3 block rounded-lg px-3 py-2.5 font-semibold transition-colors duration-200 hover:bg-gray-100">
                  Tất cả sản phẩm
                </Link>
                {catalog.loading && <p className="px-3 py-2 text-gray-500">Đang tải danh mục...</p>}
                {catalog.error && <button type="button" onClick={catalog.retry} className="px-3 py-2 text-sm text-red-600">Tải lại danh mục</button>}
                <div className="grid grid-cols-2 gap-4 border-t pt-3">
                  <div>
                    <h3 className="mb-2 px-3 text-sm font-bold">Danh mục</h3>
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/shop?category=${encodeURIComponent(category.slug)}`}
                        className="block rounded-lg px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-100"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                  <div>
                    <h3 className="mb-2 px-3 text-sm font-bold">Phong cách</h3>
                    {styles.map((style) => (
                      <Link
                        key={style.id}
                        href={`/shop?style=${encodeURIComponent(style.slug)}`}
                        className="block rounded-lg px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-100"
                      >
                        {style.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Link href="/" className="py-2 transition-colors hover:text-gray-500">
            Hàng mới
          </Link>
          <Link href="/" className="py-2 transition-colors hover:text-gray-500">
            Khuyến mãi
          </Link>
        </div>

        {/* 3. Icon giỏ hàng bên phải */}
        <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
          {/* Admin dùng nút disabled thay cho link để không thể bấm mở giỏ hàng. */}
          {!canPurchase ? <button type="button" disabled title="Giỏ hàng không khả dụng" className="flex size-10 cursor-not-allowed items-center justify-center rounded-full opacity-40">
            <ShoppingCart size={22} />
          </button> : <Link href="/cart" title="Giỏ hàng" onClick={() => setMenuOpen(false)} className="relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100">
            <ShoppingCart size={22} />
            {totalQuantity > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] leading-5 text-white">{totalQuantity > 99 ? "99+" : totalQuantity}</span>}
          </Link>}
          {/* Đồng bộ tài khoản Firebase và đóng menu mobile khi mở mục tài khoản. */}
          <AccountMenu onOpen={() => setMenuOpen(false)} />
        </div>
      </div>
      {menuOpen && (
        <div className="border-t bg-white px-4 py-2 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 text-sm font-medium">
            <Link href="/shop" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-100">
              Sản phẩm
            </Link>
            <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-100">
              Hàng mới
            </Link>
            <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-100">
              Khuyến mãi
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
