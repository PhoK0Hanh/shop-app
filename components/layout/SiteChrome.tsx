"use client";
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

// Khu quản trị dùng shell riêng; các trang mua sắm giữ navbar/footer hiện tại.
export default function SiteChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path === '/admin' || path.startsWith('/admin/')) return <>{children}</>;
  return <><Navbar /><main className="flex-1">{children}</main><Footer /></>;
}
