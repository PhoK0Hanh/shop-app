"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { demoStorageKey } from '@/lib/admin-demo-data';

export default function DemoAdminButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [guest, setGuest] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => onAuthStateChanged(auth, user => setGuest(!user)), []);
  if (!guest) return null;
  function enter() {
    try {
      // Bắt đầu demo mới mà không đăng nhập Firebase hoặc tạo cookie admin.
      sessionStorage.removeItem(demoStorageKey);
      router.push('/demo/admin');
    } catch { setError('Vui lòng cho phép bộ nhớ phiên của trình duyệt để mở demo.'); }
  }
  return <div className="mt-6 border-t border-gray-200 pt-6">
    <button type="button" disabled={disabled} onClick={enter} className="shop-press w-full rounded-full border border-black px-5 py-3 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50">Trải nghiệm trang quản trị</button>
    <p className="mt-2 text-center text-xs leading-relaxed text-gray-500">Không cần tài khoản. Thử thêm, sửa, xóa trên dữ liệu giả; thay đổi chỉ lưu trong phiên trình duyệt.</p>
    {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
  </div>;
}
