"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown01,
  ArrowDown10,
  ArrowDownAZ,
  CalendarArrowDown,
  CalendarArrowUp,
  ChartNoAxesCombined,
} from "lucide-react";
import type { Product } from "@/lib/mock-data";
import { getSellingPrice } from "@/lib/product-filters";
import ProductCard from "@/components/product/ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

const pageSize = 9;
const sortOptions = [
  { value: "newest", label: "Mới nhất", icon: CalendarArrowDown },
  { value: "oldest", label: "Cũ nhất", icon: CalendarArrowUp },
  { value: "price-asc", label: "Giá tăng dần", icon: ArrowDown01 },
  { value: "price-desc", label: "Giá giảm dần", icon: ArrowDown10 },
  { value: "name", label: "Tên A–Z", icon: ArrowDownAZ },
  { value: "bestselling", label: "Bán chạy nhất", icon: ChartNoAxesCombined },
] as const;

type SortOrder = (typeof sortOptions)[number]["value"];

function getPaginationItems(currentPage: number, pageCount: number) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const start = currentPage <= 3
    ? 2
    : Math.min(pageCount - 2, currentPage - 1);
  const end = currentPage >= pageCount - 2
    ? pageCount - 1
    : Math.min(pageCount - 1, Math.max(3, currentPage + 1));
  const items: (number | "start-ellipsis" | "end-ellipsis")[] = [1];

  if (start === 3) items.push(2);
  else if (start > 3) items.push("start-ellipsis");

  for (let number = start; number <= end; number++) items.push(number);

  if (end === pageCount - 2) items.push(pageCount - 1);
  else if (end < pageCount - 2) items.push("end-ellipsis");

  items.push(pageCount);
  return items;
}

export default function ShopProducts({ products, title = "All", paginationResetKey = 0, filterTrigger }: { products: Product[]; title?: string; paginationResetKey?: number | string; filterTrigger?: ReactNode }) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [pageState, setPageState] = useState({ number: 1, resetKey: paginationResetKey });
  const page = pageState.resetKey === paginationResetKey ? pageState.number : 1;
  function setPage(number: number) {
    setPageState({ number, resetKey: paginationResetKey });
  }
  const selectedOption = sortOptions.find((option) => option.value === sortOrder)!;
  const SortIcon = selectedOption.icon;
  const sortedProducts = [...products].sort((a, b) => {
    let difference = 0;
    switch (sortOrder) {
      case "newest":
        difference = b.createdAt.localeCompare(a.createdAt);
        break;
      case "oldest":
        difference = a.createdAt.localeCompare(b.createdAt);
        break;
      case "price-asc":
        difference = getSellingPrice(a) - getSellingPrice(b);
        break;
      case "price-desc":
        difference = getSellingPrice(b) - getSellingPrice(a);
        break;
      case "name":
        difference = a.name.localeCompare(b.name, "vi", { sensitivity: "base", numeric: true });
        break;
      case "bestselling":
        difference = b.soldCount - a.soldCount;
        break;
    }
    return difference || a.id.localeCompare(b.id, "en", { numeric: true });
  });
  const pageCount = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * pageSize;
  const visibleProducts = sortedProducts.slice(offset, offset + pageSize);

  return (
    <section className="min-w-0 flex-1 space-y-6" aria-labelledby="shop-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex w-full items-center justify-between gap-3 lg:w-auto">
          <h1 id="shop-title" className="text-3xl font-bold">{title}</h1>
          {filterTrigger}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <p className="text-gray-500" aria-live="polite">
            {products.length === 0 ? "0 sản phẩm" : `${offset + 1}–${offset + visibleProducts.length} / ${products.length} sản phẩm`}
          </p>
          <span id="sort-label" className="text-gray-500">Sắp xếp:</span>
          <Select
            value={sortOrder}
            onValueChange={(value) => {
              const option = sortOptions.find((item) => item.value === value);
              if (option) {
                setSortOrder(option.value);
                setPage(1);
              }
            }}
          >
            <SelectTrigger aria-labelledby="sort-label" className="min-w-40 bg-white [&>svg]:transition-transform [&>svg]:duration-200 data-popup-open:[&>svg]:rotate-180">
              <span className="flex items-center gap-2">
                <SortIcon aria-hidden="true" size={16} />
                {selectedOption.label}
              </span>
            </SelectTrigger>
            <SelectContent align="end" alignItemWithTrigger={false}>
              {sortOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <Icon aria-hidden="true" size={16} />
                    {option.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {visibleProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {visibleProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} loading={index === 0 ? "eager" : "lazy"} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-gray-500">Không có sản phẩm.</p>
      )}

      {pageCount > 1 && (
        <nav aria-label="Phân trang sản phẩm" className="flex items-center justify-between gap-2 border-t pt-5">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            Trước
          </button>
          <div className="flex flex-wrap justify-center gap-1">
            {getPaginationItems(currentPage, pageCount).map((number) => (
              typeof number === "string" ? (
                <span key={number} className="flex size-9 items-center justify-center">
                  <span aria-hidden="true">…</span>
                  <span className="sr-only">Các trang được ẩn</span>
                </span>
              ) : (
              <button
                key={number}
                type="button"
                aria-label={`Trang ${number}`}
                aria-current={number === currentPage ? "page" : undefined}
                onClick={() => setPage(number)}
                className={`size-9 rounded-lg text-sm ${number === currentPage ? "bg-black text-white" : "hover:bg-gray-100"}`}
              >
                {number}
              </button>
              )
            ))}
          </div>
          <button
            type="button"
            disabled={currentPage === pageCount}
            onClick={() => setPage(currentPage + 1)}
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sau
            <ArrowRight aria-hidden="true" size={16} />
          </button>
        </nav>
      )}
    </section>
  );
}
