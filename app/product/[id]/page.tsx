import ProductDetailContent from "@/components/product/ProductDetailContent";

// Client dùng Axios gọi API theo ID route, không query SQL từ page.
export default async function ProductDetailPage({ params }: { params: Promise<{id: string}> }) {
  const { id } = await params;
  return <ProductDetailContent key={id} id={id} />;
}
