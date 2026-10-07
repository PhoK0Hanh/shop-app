import ShopContent from "@/components/product/ShopContent";
import Link from "next/link";
import { categories, products, styles } from "@/lib/mock-data";
import { parseFilterQuery } from "@/lib/product-filters";

export default async function ShopPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }
  const filters = parseFilterQuery(query.toString(), categories, styles);
  const category = categories.find((item) => item.id === filters.categoryId);
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="mb-6 text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li><Link href="/" className="hover:text-black">Home</Link></li>
          <li>/</li>
          <li>
            {category ? (
              <Link href="/shop" className="hover:text-black">Shop</Link>
            ) : (
              <span className="text-black">Shop</span>
            )}
          </li>
          {category && (
            <>
              <li>/</li>
              <li className="text-black">{category.name}</li>
            </>
          )}
        </ol>
      </nav>
      <ShopContent categories={categories} styles={styles} products={products} filterQuery={query.toString()} />
    </div>
  );
}
