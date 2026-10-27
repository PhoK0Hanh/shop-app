"use client";
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter,usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { clearServerSession } from '@/lib/firebase/session-client';
import { Package, ClipboardList, Users, LayoutDashboard, ArrowLeft, LogOut, Menu, X } from 'lucide-react';

import { useAdminEnvironment } from './AdminEnvironment';

export default function AdminShell({ children, name }: { children: ReactNode; name: string }) {
  const router = useRouter();
  const { basePath, demo } = useAdminEnvironment();
  const pathname=usePathname();
  const ordersPage=pathname.startsWith(`${basePath}/orders`);
  const usersPage=pathname.startsWith(`${basePath}/users`);
  const productsPage=pathname.startsWith(`${basePath}/products`);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    if (demo) { demo.exit(); return; }
    if (busy) return;
    setBusy(true); setError('');
    try { await clearServerSession(); await signOut(auth); router.replace('/'); router.refresh(); }
    catch { setError('Chưa thể đăng xuất. Vui lòng thử lại.'); setBusy(false); }
  }
  // Mọi liên kết giữ người xem trong đúng khu admin thật hoặc demo.
  return <div className="min-h-screen bg-[#F6F6F6] text-gray-900 lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
    {open && <button title="Đóng menu" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/30 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-gray-200 bg-white p-5 transition-transform lg:sticky lg:top-0 lg:h-screen ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="mb-10 flex items-center justify-between"><Link href={basePath} className="text-2xl font-black tracking-tight">SHOP.CO <span className="block text-[10px] font-medium tracking-[0.3em] text-gray-400">QUẢN TRỊ</span></Link><button title="Đóng menu" onClick={() => setOpen(false)} className="lg:hidden"><X size={20} /></button></div>
      <nav className="space-y-2">
        <Link href={basePath} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${!ordersPage&&!usersPage&&!productsPage?'bg-black text-white':'hover:bg-gray-100'}`}><LayoutDashboard size={18} />Tổng quan</Link>
        <Link href={`${basePath}/products`} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${productsPage?'bg-black text-white':'hover:bg-gray-100'}`}><Package size={18} />Sản phẩm</Link>
        <Link href={`${basePath}/orders`} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${ordersPage?'bg-black text-white':'hover:bg-gray-100'}`}><ClipboardList size={18} />Đơn hàng</Link>
        <Link href={`${basePath}/users`} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${usersPage?'bg-black text-white':'hover:bg-gray-100'}`}><Users size={18} />Tài khoản</Link>
      </nav>
      <div className="mt-auto space-y-2 border-t border-gray-100 pt-5">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-gray-100"><ArrowLeft size={18} />Về cửa hàng</Link>
        <button onClick={logout} disabled={busy} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"><LogOut size={18} />{busy ? 'Đang đăng xuất...' : demo ? 'Thoát demo' : 'Đăng xuất'}</button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </aside>
    <div className="min-w-0">
      <header className="flex h-20 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 sm:px-8">
        <div className="flex items-center gap-3"><button title="Mở menu" onClick={() => setOpen(true)} className="lg:hidden"><Menu size={22} /></button><h1 className="text-xl font-semibold">{usersPage?'Quản lý tài khoản':ordersPage?'Quản lý đơn hàng':productsPage?'Quản lý sản phẩm':'Tổng quan'}</h1></div>
        <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">{name.slice(0, 1).toUpperCase()}</span><div className="hidden sm:block"><p className="text-sm font-medium">{name}</p><p className="text-xs text-gray-500">Quản trị viên</p></div></div>
      </header>
      <main className="p-4 sm:p-8">
        {demo && <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div><p className="font-semibold">Chế độ trải nghiệm — dữ liệu giả</p><p className="mt-1">Thay đổi chỉ lưu trong phiên trình duyệt, giữ khi F5 và xóa khi thoát demo hoặc đóng tab.</p></div>
          <button type="button" onClick={demo.reset} className="rounded-full border border-amber-300 bg-white px-4 py-2 font-medium hover:bg-amber-100">Đặt lại dữ liệu</button>
        </div>}
        {children}
      </main>
    </div>
  </div>;
}
