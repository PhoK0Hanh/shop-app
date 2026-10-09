"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/lib/use-api";
import type { Category, Style } from "@/lib/catalog";
import type { ShopPageData } from "@/lib/shop-query";
import { parseShopQuery } from "@/lib/shop-query";
import { parseFilterQuery } from "@/lib/product-filters";
import ShopContent from "@/components/product/ShopContent";
import ApiStatus from "@/components/ApiStatus";

export default function ShopLoader() {
  const query = useSearchParams().toString();
  const router = useRouter();
  const catalog = useApi<{ categories: Category[]; styles: Style[] }>("/catalog");
  const result = useApi<ShopPageData>(`/products${query ? `?${query}` : ""}`);
  useEffect(() => {
    // API trả trang đã clamp; đồng bộ URL khi mở số trang vượt giới hạn.
    if (!result.data || parseShopQuery(query).page === result.data.page) return;
    const params = new URLSearchParams(query);
    if (result.data.page === 1) params.delete("page");
    else params.set("page", String(result.data.page));
    router.replace(params.size ? `/shop?${params}` : "/shop", { scroll: false });
  }, [result.data, query, router]);
  if (!catalog.data || !result.data) return <ApiStatus error={catalog.error || result.error} retry={() => { catalog.retry(); result.retry(); }} />;
  const { categories, styles } = catalog.data;
  const filters = parseFilterQuery(query, categories, styles);
  const category = categories.find((item) => item.id === filters.categoryId);
  return <div className="mx-auto max-w-7xl px-4 py-8">
    <nav className="mb-6 text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li><Link href="/" className="hover:text-black">Home</Link></li><li>/</li>
        <li>{category ? <Link href="/shop" className="hover:text-black">Shop</Link> : <span className="text-black">Shop</span>}</li>
        {category && <><li>/</li><li className="text-black">{category.name}</li></>}
      </ol>
    </nav>
    <ShopContent categories={categories} styles={styles} shop={result.data} filterQuery={query} />
  </div>;
}
