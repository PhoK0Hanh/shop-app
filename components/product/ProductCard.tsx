import Image from "next/image";
import Link from "next/link";
import { Product, getDiscountPercent, formatPrice } from "@/lib/mock-data";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const discount = getDiscountPercent(product.originalPrice, product.salePrice);

  return (
    <Link
      href={`/product/${product.id}`}
      className="min-w-0 rounded-2xl border p-2 transition-shadow hover:shadow-xl"
    >
      <div className="flex flex-col gap-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 295px, (min-width: 1024px) 25vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <div className="truncate font-bold leading-6" title={product.name}>
            {product.name}
          </div>
          {discount !== null ? (
            <div className="flex min-h-8 flex-wrap content-start items-center gap-1 text-sm font-bold sm:text-base">
              <div className="text-black">
                {formatPrice(product.salePrice!)}
              </div>
              <del className="text-gray-400">
                {formatPrice(product.originalPrice)}
              </del>
              <span className="text-red-600 rounded-full bg-red-100 px-2 py-1 text-xs">
                -{discount}%
              </span>
            </div>
          ) : (
            <div className="flex min-h-8 items-center text-sm font-bold text-black sm:text-base">
              {formatPrice(product.originalPrice)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
