import ProductDetailContent from "@/components/product/ProductDetailContent";

// Metadata tiếng Việt dùng chung cho trang chi tiết tải sản phẩm qua API.
export const metadata={title:"Chi tiết sản phẩm | SHOP.CO"};

// Client dùng Axios gọi API theo ID route, không query SQL từ page.
export default async function ProductDetailPage({ params }: { params: Promise<{id: string}> }) {
  const { id } = await params;
  return <ProductDetailContent key={id} id={id} />;
}
