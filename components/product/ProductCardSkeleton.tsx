// Giữ khung ảnh vuông, tên và giá gần với ProductCard để giảm nhảy bố cục.
export default function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="min-w-0 animate-pulse rounded-2xl border p-2 motion-reduce:animate-none">
      <div className="aspect-square w-full rounded-2xl bg-gray-200" />
      <div className="mt-2 flex h-6 items-center">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
      </div>
      <div className="flex min-h-8 items-center gap-2">
        <div className="h-5 w-1/2 rounded bg-gray-200" />
        <div className="h-5 w-1/4 rounded bg-gray-100" />
      </div>
    </div>
  );
}
