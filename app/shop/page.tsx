import ShopContent from "@/components/product/ShopContent";
import Link from "next/link";
import { getCategories, getShopProducts, getStyles } from "@/lib/products";
import { parseFilterQuery } from "@/lib/product-filters";
import { parseShopQuery } from "@/lib/shop-query";
import { redirect } from "next/navigation";

export default async function ShopPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // Đọc các lựa chọn bộ lọc trước để tra slug trong URL sang ID database.
  const [categories, styles] = await Promise.all([
    getCategories(),
    getStyles(),
  ]);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }
  const filters = parseFilterQuery(query.toString(), categories, styles);
  const { sort, page } = parseShopQuery(query.toString());
  const shop = await getShopProducts(filters, sort, page);
  // Trang vượt giới hạn được chuyển về trang cuối, giữ nguyên các bộ lọc khác.
  if (page !== shop.page) {
    if (shop.page === 1) query.delete("page");
    else query.set("page", String(shop.page));
    redirect(query.size ? `/shop?${query}` : "/shop");
  }
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
      <ShopContent categories={categories} styles={styles} shop={shop} filterQuery={query.toString()} />
    </div>
  );
}
