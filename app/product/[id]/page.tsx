import { products } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 ">
      <div className="flex flex-col gap-8 lg:flex-row">
        <ProductGallery images={product.images} productName={product.name} />

        <ProductInfo key={product.id} product={product} />
      </div>
    </div>
  );
}
