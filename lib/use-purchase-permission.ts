"use client";

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { api } from '@/lib/api';

export function usePurchasePermission() {
  const [permission, setPermission] = useState({ canPurchase: false, isAdmin: false, message: 'Đang kiểm tra tài khoản...' });
  useEffect(() => {
    let controller: AbortController | undefined;
    function refresh() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setPermission({ canPurchase: false, isAdmin: false, message: 'Đang kiểm tra tài khoản...' });
      // Lấy role từ session server, không suy đoán admin bằng tên hoặc email Firebase.
      api.get('/auth/session', { signal: request.signal, validateStatus: () => true }).then(({ status, data }) => {
        if (request.signal.aborted) return;
        if (status === 200 && data?.user?.role === 'admin') {
          setPermission({ canPurchase: false, isAdmin: true, message: 'Tài khoản admin không thể thêm giỏ hàng hoặc đặt hàng.' });
        } else if ((status === 200 && data?.user?.role === 'customer') || (status === 401 && !auth.currentUser)) {
          setPermission({ canPurchase: true, isAdmin: false, message: '' });
        } else {
          setPermission({ canPurchase: false, isAdmin: false, message: 'Chưa kiểm tra được quyền mua hàng. Vui lòng đăng nhập lại.' });
        }
      }).catch(() => {
        if (!request.signal.aborted) setPermission({ canPurchase: false, isAdmin: false, message: 'Không kiểm tra được tài khoản. Vui lòng tải lại trang.' });
      });
    }
    const unsubscribe = onAuthStateChanged(auth, refresh);
    // Firebase có thể phát sự kiện trước khi cookie được tạo; kiểm tra lại sau API session.
    window.addEventListener('shop-session-changed', refresh);
    return () => { unsubscribe(); controller?.abort(); window.removeEventListener('shop-session-changed', refresh); };
  }, []);
  return permission;
}
