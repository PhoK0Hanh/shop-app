import { Suspense } from "react";
import ShopLoader from "@/components/product/ShopLoader";
import ShopSkeleton from "@/components/product/ShopSkeleton";

// Tiêu đề trang dùng tiếng Việt cùng giao diện danh sách sản phẩm.
export const metadata={title:"Sản phẩm | SHOP.CO"};

// Suspense bao useSearchParams; shop tải dữ liệu REST qua Axios ở client.
export default function ShopPage() {
  return <Suspense fallback={<ShopSkeleton />}><ShopLoader /></Suspense>;
}
