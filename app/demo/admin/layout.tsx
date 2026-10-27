import type { ReactNode } from 'react';
import DemoAdminProvider from '@/components/admin/DemoAdminProvider';

export const metadata = { title: 'Trải nghiệm quản trị | SHOP.CO', robots: { index: false, follow: false } };
// Khu demo công khai chỉ dùng dữ liệu giả trong trình duyệt, không dùng layout admin thật.
export default function DemoLayout({ children }: { children: ReactNode }) {
  return <DemoAdminProvider>{children}</DemoAdminProvider>;
}
