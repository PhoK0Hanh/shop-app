import { products } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductCard from "@/components/product/ProductCard";
import ProductDetailsTabs from "@/components/product/ProductDetailsTabs";

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

  const suggestedProducts = products
    .filter(
      (item) =>
        item.id !== product.id && item.categoryId === product.categoryId,
    )
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 ">
      <div className="flex flex-col gap-8 lg:flex-row">
        <ProductGallery
          key={`gallery-${product.id}`}
          images={product.images}
          productName={product.name}
        />
        <ProductInfo key={`info-${product.id}`} product={product} />
      </div>
      <ProductDetailsTabs key={`details-${product.id}`} description={product.description} />
      {suggestedProducts.length > 0 && (
        <section className="mt-12 border-t pt-9">
          <h2 className="mb-7 text-center text-3xl font-bold lg:text-5xl">
            YOU MIGHT ALSO LIKE
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {suggestedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
