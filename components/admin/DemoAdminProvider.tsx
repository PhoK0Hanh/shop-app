"use client";
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createDemoClient, readDemo, resetDemo, clearDemo } from '@/lib/admin-demo';
import { AdminEnvironment } from './AdminEnvironment';
import AdminShell from './AdminShell';

export default function DemoAdminProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<ReturnType<typeof createDemoClient> | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let current: ReturnType<typeof createDemoClient> | undefined;
    // Chỉ truy cập sessionStorage sau hydration; chưa có adapter thì không mount bảng admin.
    Promise.resolve().then(() => {
      if (cancelled) return;
      try { readDemo(sessionStorage); current = createDemoClient(sessionStorage); setSession(current); }
      catch { setError('Cần cho phép bộ nhớ phiên của trình duyệt để sử dụng demo.'); }
    });
    return () => { cancelled = true; current?.dispose(); };
  }, []);
  function reset() {
    if (!window.confirm('Xóa các thay đổi demo và khôi phục dữ liệu ban đầu?')) return;
    try { resetDemo(sessionStorage); setRevision(n => n + 1); setError(''); }
    catch { setError('Chưa đặt lại được dữ liệu. Vui lòng kiểm tra bộ nhớ trình duyệt.'); }
  }
  function exit() {
    try {
      clearDemo(sessionStorage);
      session?.dispose();
      router.replace('/');
    } catch { setError('Chưa xóa được phiên demo. Vui lòng thử lại.'); }
  }
  if (!session) return <div className="p-8 text-center"><p>{error || 'Đang chuẩn bị dữ liệu demo...'}</p><a href="/login" className="mt-4 inline-block underline">Về đăng nhập</a></div>;
  return <AdminEnvironment.Provider value={{ client: session.client, basePath: '/demo/admin', demo: { reset, exit } }}>
    <AdminShell name="Quản trị viên demo">
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      <div key={revision}>{children}</div>
    </AdminShell>
  </AdminEnvironment.Provider>;
}
