import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";
import { shopPageSize } from "@/lib/shop-query";

// Mô phỏng bố cục bộ lọc và lưới sản phẩm trong lúc chờ hai API của Shop.
export default function ShopSkeleton() {
  return (
    <div role="status" className="mx-auto max-w-7xl px-4 py-8">
      <span className="sr-only">Đang tải sản phẩm...</span>
      <div aria-hidden="true" className="mb-6 h-5 w-40 animate-pulse rounded bg-gray-200 motion-reduce:animate-none" />
      <div className="flex flex-col gap-3 lg:flex-row">
        <div aria-hidden="true" className="hidden space-y-8 rounded-2xl border p-5 lg:block lg:w-64 lg:shrink-0">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="animate-pulse space-y-4 motion-reduce:animate-none">
              <div className="h-6 w-1/2 rounded bg-gray-200" />
              <div className="h-20 rounded-xl bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-6">
          <div aria-hidden="true" className="flex min-h-10 animate-pulse flex-wrap items-center justify-between gap-4 motion-reduce:animate-none">
            <div className="h-9 w-56 rounded bg-gray-200" />
            <div className="h-9 w-40 rounded-lg bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {Array.from({ length: shopPageSize }, (_, index) => <ProductCardSkeleton key={index} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
