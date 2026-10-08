import type { Metadata } from "next";
import Link from "next/link";
import CartContent from "@/components/cart/CartContent";

export const metadata: Metadata = { title: "Giỏ hàng | SHOP.CO" };

// Giữ phần tiêu đề trên server; CartContent xử lý giỏ hàng trên trình duyệt.
export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 text-sm text-gray-500">
        <ol className="flex items-center gap-2"><li><Link href="/" className="hover:text-black">Home</Link></li><li>/</li><li className="text-black">Giỏ hàng</li></ol>
      </nav>
      <h1 className="mb-8 text-3xl font-bold lg:text-4xl">Giỏ hàng của bạn</h1>
      <CartContent />
    </div>
  );
}
