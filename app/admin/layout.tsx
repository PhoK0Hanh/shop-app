import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/firebase/session';
import AdminShell from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Chặn truy cập trực tiếp vào trang admin bằng session và quyền hiện tại trong DB.
  const user = await getSessionUser();
  if (!user) redirect('/login?next=%2Fadmin');
  if (user.role !== 'admin') redirect('/');
  return <AdminShell name={user.name}>{children}</AdminShell>;
}
