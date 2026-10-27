import { notFound } from 'next/navigation';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminUsers from '@/components/admin/AdminUsers';

export default async function DemoPage({ params, searchParams }: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { section = [] } = await params;
  const query = await searchParams;
  const value = (key: string) => typeof query[key] === 'string' ? query[key] as string : '';
  const key = JSON.stringify(query);
  if (!section.length) return <AdminOverview />;
  if (section.length !== 1) notFound();
  // Dùng lại bảng thật với adapter demo do layout cung cấp, giữ bộ lọc từ liên kết tổng quan.
  switch (section[0]) {
    case 'products': return <AdminProducts key={key} initialSearch={value('search')} initialStatus={value('status')} initialVariantId={value('variants')} />;
    case 'orders': return <AdminOrders key={key} initialStatus={value('status')} initialFrom={value('from')} initialTo={value('to')} initialOrderId={value('order')} />;
    case 'users': return <AdminUsers key={key} initialRole={value('role')} initialStatus={value('status')} />;
    default: notFound();
  }
}
