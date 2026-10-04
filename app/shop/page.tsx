import ShopContent from "@/components/product/ShopContent";
import { categories, products, styles } from "@/lib/mock-data";

export default async function ShopPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ShopContent categories={categories} styles={styles} products={products} filterQuery={query.toString()} />
    </div>
  );
}
