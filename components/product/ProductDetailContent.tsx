"use client";

import Link from "next/link";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductCard from "@/components/product/ProductCard";
import ProductDetailsTabs from "@/components/product/ProductDetailsTabs";
import { useApi } from "@/lib/use-api";
import ApiStatus from "@/components/ApiStatus";
import type { Product, Category } from "@/lib/catalog";

// Product detail is loaded through REST instead of importing server SQL.
export default function ProductDetailContent({ id }: { id: string }) {
  const detail = useApi<{product: Product; category: Category | null}>(`/products/${encodeURIComponent(id)}`);
  const suggestions = useApi<Product[]>(`/products/${encodeURIComponent(id)}/suggestions`);
  if (!detail.data) return <ApiStatus error={detail.error} retry={detail.retry} />;
  const { product, category } = detail.data;
  const suggestedProducts = suggestions.data ?? [];
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 ">
      <nav className="mb-6 text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/" className="hover:text-black">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/shop" className="hover:text-black">
              Shop
            </Link>
          </li>
          {category && (
            <>
              <li>/</li>
              <li>
                <Link
                  href={`/shop?category=${encodeURIComponent(category.slug)}`}
                  className="hover:text-black"
                >
                  {category.name}
                </Link>
              </li>
            </>
          )}
          <li>/</li>
          <li className="min-w-0 wrap-break-word text-black">{product.name}</li>
        </ol>
      </nav>
      <div className="flex flex-col gap-8 lg:flex-row">
        <ProductGallery
          key={`gallery-${product.id}`}
          images={product.images}
          productName={product.name}
        />
        <ProductInfo key={`info-${product.id}`} product={product} />
      </div>
      <ProductDetailsTabs
        key={`details-${product.id}`}
        description={product.description}
      />
      {(suggestions.loading || suggestions.error) && <ApiStatus error={suggestions.error} retry={suggestions.retry} />}
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
