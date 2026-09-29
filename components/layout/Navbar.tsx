import Link from "next/link";
import { ShoppingCart, CircleUser } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex items-center h-24 mx-auto px-10">
        {/* 1. Logo bên trái */}
        <Link href="/" className="text-4xl font-bold text-black">
          SHOP.CO
        </Link>

        {/* 2. Menu giữa/phải — ẩn trên mobile */}
        <div className="hidden md:flex gap-4 ml-10">
          <Link href="/" className="hover:text-gray-500">
            Home
          </Link>
          <Link href="/shop" className="hover:text-gray-500">
            Shop
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
