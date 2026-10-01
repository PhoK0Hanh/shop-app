import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    // <div className="flex flex-col flex-1 items-center justify-center bg-blue-100">
    <main className="flex flex-1 w-full flex-col items-center justify-between bg-yellow-200">
      <div className="w-full bg-[#F2F0F1] flex justify-center">
        <div className="flex flex-wrap max-w-7xl px-4">
          <div className="w-full lg:w-1/2 flex flex-col justify-center gap-4">
            <div className="text-[64px]/12 mt-4 font-bold text-black">
              FIND CLOTHES THAT MATCHES YOUR STYLE
            </div>
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
              priority
            />
          </div>
        </div>
      </div>
      <div className="border-black border-2">Body area</div>
    </main>
    // </div>
  );
}
