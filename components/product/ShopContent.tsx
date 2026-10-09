"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { SlidersHorizontal, X } from "lucide-react";
import type { Category, Style } from "@/lib/catalog";
import type { ShopPageData, ShopSortOrder } from "@/lib/shop-query";
import ProductFilter from "@/components/product/ProductFilter";
import ShopProducts from "@/components/product/ShopProducts";
import {
  parseFilterQuery,
  serializeFilterQuery,
} from "@/lib/product-filters";
import type { ProductFilters } from "@/lib/product-filters";

interface ShopContentProps {
  categories: Category[];
  styles: Style[];
  shop: ShopPageData;
  filterQuery: string;
}

export default function ShopContent({
  categories,
  styles,
  shop,
  filterQuery,
}: ShopContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const appliedFilters = parseFilterQuery(filterQuery, categories, styles);
  const [draftFilters, setDraftFilters] = useState<ProductFilters>(
    () => appliedFilters,
  );
  const [previousQuery, setPreviousQuery] = useState(filterQuery);
  if (previousQuery !== filterQuery) {
    setPreviousQuery(filterQuery);
    setDraftFilters(appliedFilters);
  }
  const [filterOpen, setFilterOpen] = useState(false);
  const title =
    categories.find((category) => category.id === appliedFilters.categoryId)
      ?.name ?? "Tất cả sản phẩm";

  // Thay URL để ShopLoader gọi lại REST API bằng Axios.
  function navigate(query: string) {
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  function applyFilters(filters: ProductFilters) {
    // Dùng slug từ dữ liệu server để URL luôn khớp với các lựa chọn trong bộ lọc.
    const query = serializeFilterQuery(filters, categories, styles, filterQuery);
    navigate(query);
    setFilterOpen(false);
  }

  function changeSort(sort: ShopSortOrder) {
    const query = new URLSearchParams(filterQuery);
    if (sort === "newest") query.delete("sort");
    else query.set("sort", sort);
    query.delete("page"); // Đổi sort luôn quay về trang đầu.
    navigate(query.toString());
  }

  function changePage(page: number) {
    const query = new URLSearchParams(filterQuery);
    if (page === 1) query.delete("page");
    else query.set("page", String(page));
    navigate(query.toString());
  }

  return (
    <Dialog.Root open={filterOpen} onOpenChange={setFilterOpen}>
      <div className="flex flex-col lg:flex-row gap-3">
        <aside
          aria-label="Product filters"
          className="hidden lg:block lg:w-64 lg:shrink-0"
        >
          <ProductFilter
            categories={categories}
            styles={styles}
            value={draftFilters}
            onChange={setDraftFilters}
            onApply={applyFilters}
          />
        </aside>
        <ShopProducts
          shop={shop}
          title={title}
          pending={pending}
          onSortChange={changeSort}
          onPageChange={changePage}
          filterTrigger={
            <Dialog.Trigger className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100 lg:hidden">
              <SlidersHorizontal aria-hidden="true" size={18} />
              Bộ lọc
            </Dialog.Trigger>
          }
        />
      </div>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white text-black shadow-xl">
          <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
            <Dialog.Title className="text-xl font-bold">Bộ lọc</Dialog.Title>
            <Dialog.Close
              aria-label="Đóng bộ lọc"
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <X aria-hidden="true" size={20} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Chọn danh mục, khoảng giá, phong cách và kích cỡ rồi nhấn Áp dụng.
          </Dialog.Description>
          <div className="min-h-0 overflow-y-auto overscroll-contain p-3">
            <ProductFilter
              categories={categories}
              styles={styles}
              value={draftFilters}
              onChange={setDraftFilters}
              onApply={applyFilters}
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
