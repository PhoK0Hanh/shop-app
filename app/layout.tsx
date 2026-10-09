import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SHOP.CO | Thời trang cho phong cách của bạn",
  description: "Khám phá thời trang nam và nữ tại SHOP.CO. Lựa chọn trang phục theo phong cách, màu sắc và kích cỡ của bạn.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Shell quản trị được tách khỏi navbar/footer mua sắm. */}
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
