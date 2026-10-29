// Giữ tỷ lệ gallery và bố cục thông tin giống trang thật trong lúc chờ API chi tiết.
export default function ProductDetailSkeleton() {
  return (
    <div role="status" className="mx-auto max-w-7xl px-4 py-8">
      <span className="sr-only">Đang tải chi tiết sản phẩm...</span>
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="mb-6 h-5 w-56 max-w-full rounded bg-gray-200" />
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 w-full max-w-100 lg:w-[48%] lg:max-w-none lg:shrink-0">
            <div className="flex justify-center overflow-hidden rounded-lg bg-[#F2F0F1]">
              <div className="aspect-[400/533] w-[48%] rounded bg-gray-200" />
            </div>
            <div className="mt-4 flex gap-2 overflow-hidden pb-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-[111px] w-[84px] shrink-0 rounded-lg bg-gray-200" />
              ))}
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-6">
            <div className="h-10 w-4/5 rounded bg-gray-200 lg:h-12" />
            <div className="flex gap-3">
              <div className="h-8 w-32 rounded bg-gray-200" />
              <div className="h-8 w-24 rounded bg-gray-100" />
            </div>
            <div className="border-t pt-5">
              <div className="mb-3 h-6 w-24 rounded bg-gray-200" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="size-10 rounded-full bg-gray-200" />
                ))}
              </div>
            </div>
            <div className="border-t pt-5">
              <div className="mb-3 h-6 w-28 rounded bg-gray-200" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="h-12 w-16 rounded-full bg-gray-200" />
                ))}
              </div>
            </div>
            <div className="border-t pt-5">
              <div className="flex gap-3">
                <div className="h-12 w-32 shrink-0 rounded-full bg-gray-200" />
                <div className="h-12 min-w-0 flex-1 rounded-full bg-gray-200" />
              </div>
              <div className="mt-2 h-5 w-48 max-w-full rounded bg-gray-100" />
            </div>
          </div>
        </div>
        <div className="mt-12">
          <div className="flex gap-4 border-b py-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="mx-auto h-5 w-1/4 rounded bg-gray-200" />
            ))}
          </div>
          <div className="space-y-3 py-6">
            <div className="h-7 w-24 rounded bg-gray-200" />
            <div className="h-5 w-full rounded bg-gray-100" />
            <div className="h-5 w-3/4 rounded bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
