import { Suspense } from "react";
import ShopLoader from "@/components/product/ShopLoader";
import ApiStatus from "@/components/ApiStatus";

// Suspense bao useSearchParams; shop tải dữ liệu REST qua Axios ở client.
export default function ShopPage() {
  return <Suspense fallback={<ApiStatus />}><ShopLoader /></Suspense>;
}
