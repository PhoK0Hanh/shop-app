import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/product/ProductCard";
import { getNewArrivals, getTopSellers } from "@/lib/mock-data";

export default function Home() {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full bg-[#F2F0F1]">
        <div className="flex flex-wrap max-w-7xl mx-auto px-4">
          <div className="w-full lg:w-1/2 flex flex-col justify-center gap-4 py-8 lg:pr-6">
            <h1 className="text-4xl leading-tight lg:text-[64px] lg:leading-[1.05] font-bold text-black">
              FIND CLOTHES THAT MATCHES YOUR STYLE
            </h1>
            <div className="text-[16px] text-black">
              Browse through our diverse range of meticulously crafted garments,
              designed to bring out your individuality and cater to your sense
              of style.
            </div>
            <Link
              className="flex h-12 w-39.5 items-center justify-center rounded-full bg-black px-5 text-white transition-colors hover:bg-[#383838]"
              href="/shop"
            >
              Shop Now
            </Link>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:divide-x-2">
              <div>
                <div className="text-3xl font-bold">200 +</div>
                <div>International Brands</div>
              </div>
              <div>
                <div className="text-3xl font-bold">2,000 +</div>
                <div>High-Quality Products</div>
              </div>
              <div className="col-span-2 lg:col-span-1 flex justify-center">
                <div>
                  <div className="text-3xl font-bold">30,000 +</div>
                  <div>Happy Customer</div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex items-center justify-center">
            <Image
              src="/images/hero.jpg"
              alt="Hero banner"
              width={390}
              height={448}
              sizes="(min-width: 1280px) 624px, (min-width: 1024px) 50vw, 100vw"
              className="w-full h-auto"
              preload
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full max-w-7xl items-center justify-center p-4">
        <section className="flex w-full flex-col items-center justify-center py-9 gap-7">
          <h2 className="text-center font-bold text-3xl lg:text-5xl">
            NEW ARRIVALS
          </h2>
          <div className="grid w-full grid-cols-2 lg:grid-cols-4 gap-4">
            {getNewArrivals(4).map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                loading={index === 0 ? "eager" : "lazy"}
              />
            ))}
          </div>
          <Link
            className="flex h-12 w-39.5 items-center border-2 justify-center rounded-full px-5 transition-colors bg-white text-black hover:bg-black hover:text-white"
            href="/shop"
          >
            View All
          </Link>
        </section>
        <section className="flex w-full flex-col items-center justify-center py-9 gap-7">
          <h2 className="text-center font-bold text-3xl lg:text-5xl">
            TOP SELLING
          </h2>
          <div className="grid w-full grid-cols-2 lg:grid-cols-4 gap-4">
            {getTopSellers(4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Link
            className="flex h-12 w-39.5 items-center border-2 justify-center rounded-full px-5 transition-colors bg-white text-black hover:bg-black hover:text-white"
            href="/shop"
          >
            View All
          </Link>
        </section>
        <section className="flex flex-col justify-center items-center w-full bg-[#F2F0F1] rounded-4xl py-9 gap-6 lg:gap-9">
          <h2 className="px-4 text-center font-bold text-3xl lg:text-5xl">
            BROWSE BY DRESS STYLE
          </h2>
          <div className="flex w-full flex-col gap-4 px-6 lg:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-[407fr_684fr] gap-4">
              <Link
                href="/shop?style=casual"
                className="block overflow-hidden rounded-4xl transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:brightness-95"
              >
                <Image
                  src="/images/casual.jpg"
                  alt="casual"
                  width={407}
                  height={289}
                  className="w-full h-auto rounded-4xl"
                />
              </Link>
              <Link
                href="/shop?style=formal"
                className="block overflow-hidden rounded-4xl transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:brightness-95"
              >
                <Image
                  src="/images/formal2.jpg"
                  alt="formal"
                  width={407}
                  height={289}
                  className="w-full h-auto rounded-4xl lg:hidden"
                />
                <Image
                  src="/images/formal.jpg"
                  alt="formal"
                  width={684}
                  height={289}
                  className="hidden w-full h-auto rounded-4xl lg:block"
                />
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[684fr_407fr] gap-4">
              <Link
                href="/shop?style=party"
                className="block overflow-hidden rounded-4xl transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:brightness-95"
              >
                <Image
                  src="/images/party2.jpg"
                  alt="party"
                  width={407}
                  height={289}
                  className="w-full h-auto rounded-4xl lg:hidden"
                />
                <Image
                  src="/images/party.jpg"
                  alt="party"
                  width={684}
                  height={289}
                  className="hidden w-full h-auto rounded-4xl lg:block"
                />
              </Link>
              <Link
                href="/shop?style=gym"
                className="block overflow-hidden rounded-4xl transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:brightness-95"
              >
                <Image
                  src="/images/gym.jpg"
                  alt="gym"
                  width={407}
                  height={289}
                  className="w-full h-auto rounded-4xl"
                />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
