import ShopContent from "@/components/product/ShopContent";
import { categories, products, styles } from "@/lib/mock-data";

export default function ShopPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ShopContent categories={categories} styles={styles} products={products} />
    </div>
  );
}
