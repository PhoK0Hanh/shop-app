import Link from "next/link";
import { ShoppingCart, CircleUser } from "lucide-react";
import { ChevronDown } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex items-center h-24 max-w-7xl mx-auto px-4">
        {/* 1. Logo bên trái */}
        <Link href="/" className="text-4xl font-bold text-black">
          SHOP.CO
        </Link>

        {/* 2. Menu giữa/phải — ẩn trên mobile */}
        <div className="hidden md:flex gap-4 ml-10">
          <div className="group flex items-center">
            <Link href="/shop" className="group-hover:text-gray-500">
              Shop
            </Link>
            <ChevronDown
              size={20}
              className="group-hover:rotate-180 transition delay-150 duration-300"
            />
          </div>
          <Link href="/" className="hover:text-gray-500">
            New Arrivals
          </Link>
          <Link href="/" className="hover:text-gray-500">
            On Sale
          </Link>
        </div>

        {/* 3. Icon giỏ hàng bên phải */}
        <div className="flex gap-4 ml-auto">
          <Link href="/cart">
            <ShoppingCart size={24} />
          </Link>
          <Link href="/login">
            <CircleUser size={24} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
