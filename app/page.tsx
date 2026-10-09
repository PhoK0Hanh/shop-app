"use client";

import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/product/ProductCard";
import { useApi } from "@/lib/use-api";
import type { Product } from "@/lib/catalog";
import ApiStatus from "@/components/ApiStatus";

export default function Home() {
  // Hero giữ nguyên; hai nhóm sản phẩm lấy từ PostgreSQL qua API.
  const featured = useApi<{newArrivals: Product[]; topSellers: Product[]}>("/home");
  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full bg-[#F2F0F1]">
        <div className="flex flex-wrap max-w-7xl mx-auto px-4">
          <div className="w-full lg:w-1/2 flex flex-col justify-center gap-4 py-8 lg:pr-6">
            <h1 className="text-4xl leading-tight lg:text-[64px] lg:leading-[1.05] font-bold text-black">
              KHÁM PHÁ TRANG PHỤC HỢP PHONG CÁCH CỦA BẠN
            </h1>
            <div className="text-[16px] text-black">
              Khám phá bộ sưu tập thời trang đa dạng, được chăm chút từng chi tiết
              để bạn tự tin thể hiện cá tính và phong cách riêng.
            </div>
            <Link
              className="flex h-12 w-39.5 items-center justify-center rounded-full bg-black px-5 text-white transition-colors hover:bg-[#383838]"
              href="/shop"
            >
              Mua ngay
            </Link>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:divide-x-2">
              <div>
                <div className="text-3xl font-bold">200 +</div>
                <div>Thương hiệu quốc tế</div>
              </div>
              <div>
                <div className="text-3xl font-bold">2,000 +</div>
                <div>Sản phẩm chất lượng</div>
              </div>
              <div className="col-span-2 lg:col-span-1 flex justify-center">
                <div>
                  <div className="text-3xl font-bold">30,000 +</div>
                  <div>Khách hàng hài lòng</div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex items-center justify-center">
            <Image
              src="/images/hero.jpg"
              alt="Bộ sưu tập thời trang SHOP.CO"
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
            HÀNG MỚI
          </h2>
          {!featured.data && <ApiStatus error={featured.error} retry={featured.retry} />}
          <div className="grid w-full grid-cols-2 lg:grid-cols-4 gap-4">
            {(featured.data?.newArrivals ?? []).map((product, index) => (
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
            Xem tất cả
          </Link>
        </section>
        <section className="flex w-full flex-col items-center justify-center py-9 gap-7">
          <h2 className="text-center font-bold text-3xl lg:text-5xl">
            BÁN CHẠY
          </h2>
          {!featured.data && <ApiStatus error={featured.error} retry={featured.retry} />}
          <div className="grid w-full grid-cols-2 lg:grid-cols-4 gap-4">
            {(featured.data?.topSellers ?? []).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Link
            className="flex h-12 w-39.5 items-center border-2 justify-center rounded-full px-5 transition-colors bg-white text-black hover:bg-black hover:text-white"
            href="/shop"
          >
            Xem tất cả
          </Link>
        </section>
        <section className="flex flex-col justify-center items-center w-full bg-[#F2F0F1] rounded-4xl py-9 gap-6 lg:gap-9">
          <h2 className="px-4 text-center font-bold text-3xl lg:text-5xl">
            KHÁM PHÁ THEO PHONG CÁCH
          </h2>
          <div className="flex w-full flex-col gap-4 px-6 lg:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-[407fr_684fr] gap-4">
              <Link
                href="/shop?style=casual"
                className="relative block overflow-hidden rounded-4xl transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:brightness-95"
              >
                {/* Nhãn HTML tiếng Việt phủ chữ tiếng Anh có sẵn trong ảnh. */}
                <span className="absolute left-[5%] top-[7%] z-10 flex h-[22%] w-[55%] items-center bg-white px-2 text-xl font-bold sm:text-2xl">Thường ngày</span>
                <Image
                  src="/images/casual.jpg"
                  alt="Phong cách thường ngày"
                  width={407}
                  height={289}
                  className="w-full h-auto rounded-4xl"
                />
              </Link>
              <Link
                href="/shop?style=formal"
                className="relative block overflow-hidden rounded-4xl transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:brightness-95"
              >
                <span className="absolute left-[5%] top-[7%] z-10 flex h-[22%] w-[55%] items-center bg-white px-2 text-xl font-bold sm:text-2xl">Lịch sự</span>
                <Image
                  src="/images/formal2.jpg"
                  alt="Phong cách lịch sự"
                  width={407}
                  height={289}
                  className="w-full h-auto rounded-4xl lg:hidden"
                />
                <Image
                  src="/images/formal.jpg"
                  alt="Phong cách lịch sự"
                  width={684}
                  height={289}
                  className="hidden w-full h-auto rounded-4xl lg:block"
                />
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[684fr_407fr] gap-4">
              <Link
                href="/shop?style=party"
                className="relative block overflow-hidden rounded-4xl transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:brightness-95"
              >
                <span className="absolute left-[5%] top-[7%] z-10 flex h-[22%] w-[55%] items-center bg-white px-2 text-xl font-bold sm:text-2xl">Dự tiệc</span>
                <Image
                  src="/images/party2.jpg"
                  alt="Phong cách dự tiệc"
                  width={407}
                  height={289}
                  className="w-full h-auto rounded-4xl lg:hidden"
                />
                <Image
                  src="/images/party.jpg"
                  alt="Phong cách dự tiệc"
                  width={684}
                  height={289}
                  className="hidden w-full h-auto rounded-4xl lg:block"
                />
              </Link>
              <Link
                href="/shop?style=gym"
                className="relative block overflow-hidden rounded-4xl transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:brightness-95"
              >
                <span className="absolute left-[5%] top-[7%] z-10 flex h-[22%] w-[55%] items-center bg-white px-2 text-xl font-bold sm:text-2xl">Thể thao</span>
                <Image
                  src="/images/gym.jpg"
                  alt="Phong cách thể thao"
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
