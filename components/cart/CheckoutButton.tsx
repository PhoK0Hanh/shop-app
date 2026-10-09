"use client";

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { api } from '@/lib/api';
import type { CartItem } from '@/lib/cart';
import type { ShippingInfo } from '@/lib/order-types';
import { parseShipping } from '@/lib/shipping';

export default function CheckoutButton({ items, onCreated }: { items: CartItem[]; onCreated: (items: CartItem[]) => void }) {
  const router = useRouter();
  const pending = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [shipping, setShipping] = useState<ShippingInfo>({ recipientName: '', phone: '', address: '', note: '' });
  function openShipping() {
    // Khôi phục bản nháp sau login trong handler để không gây lệch hydration.
    try {
      const stored: unknown = JSON.parse(sessionStorage.getItem('shop-shipping-draft') ?? 'null');
      if (stored) setShipping(parseShipping(stored));
    } catch { /* Bản nháp không hợp lệ thì người dùng nhập lại. */ }
    setShowForm(true);
  }
  async function checkout() {
    if (pending.current || !items.length) return;
    let recipient: ShippingInfo;
    try { recipient = parseShipping(shipping); }
    catch (error) { setError(error instanceof Error ? error.message : 'Kiểm tra lại thông tin giao hàng.'); return; }
    pending.current = true;
    setLoading(true);
    setError('');
    const submitted = items.map((item) => ({ ...item }));
    const fingerprint = JSON.stringify({ items: [...submitted].sort((a, b) => a.variantId.localeCompare(b.variantId)), shipping: recipient });
    try {
      // Giữ khóa khi timeout hoặc chuyển qua login để retry không tạo đơn trùng.
      const stored = sessionStorage.getItem('shop-checkout-request');
      let previous: { fingerprint?: string; requestId?: string } = {};
      try { previous = stored ? JSON.parse(stored) : {}; } catch { /* Khóa lỗi được thay bằng khóa mới. */ }
      const requestId = previous?.fingerprint === fingerprint && previous.requestId ? previous.requestId : crypto.randomUUID();
      sessionStorage.setItem('shop-checkout-request', JSON.stringify({ fingerprint, requestId }));
      sessionStorage.setItem('shop-shipping-draft', JSON.stringify(recipient));
      await api.post('/orders', { requestId, items: submitted, shipping: recipient });
      // Chỉ bỏ các số lượng đã đặt; giữ sản phẩm mới thêm trong lúc request đang chạy.
      onCreated(submitted);
      sessionStorage.removeItem('shop-checkout-request');
      sessionStorage.removeItem('shop-shipping-draft');
      router.push('/orders');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/login?next=%2Fcart');
      } else {
        setError(axios.isAxiosError<{ error?: string }>(error) && error.response?.data?.error
          ? error.response.data.error : 'Chưa xác nhận được đơn hàng. Vui lòng thử lại.');
      }
    } finally { pending.current = false; setLoading(false); }
  }
  return <>
    {showForm ? <form className="mt-6 border-t border-gray-200 pt-5" onSubmit={(event) => { event.preventDefault(); void checkout(); }}>
      <h3 className="mb-4 text-lg font-semibold">Thông tin giao hàng</h3>
      <fieldset disabled={loading} className="space-y-4 disabled:opacity-60">
        <label className="block text-sm font-medium">Tên người nhận <span className="text-red-500">*</span>
          <input name="recipientName" autoComplete="shipping name" required minLength={2} maxLength={100} value={shipping.recipientName}
            onChange={(event) => setShipping({ ...shipping, recipientName: event.target.value })}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:border-black" placeholder="Nguyễn Văn A" />
        </label>
        <label className="block text-sm font-medium">Số điện thoại <span className="text-red-500">*</span>
          <input name="phone" type="tel" autoComplete="shipping tel" required maxLength={30} value={shipping.phone}
            onChange={(event) => setShipping({ ...shipping, phone: event.target.value })}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:border-black" placeholder="0912345678" />
        </label>
        <label className="block text-sm font-medium">Địa chỉ giao hàng <span className="text-red-500">*</span>
          <textarea name="address" autoComplete="shipping street-address" required minLength={10} maxLength={500} rows={3} value={shipping.address}
            onChange={(event) => setShipping({ ...shipping, address: event.target.value })}
            className="mt-2 w-full resize-y rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:border-black" placeholder="Số nhà, tên đường, phường/xã, tỉnh/thành phố" />
        </label>
        <label className="block text-sm font-medium">Ghi chú <span className="font-normal text-gray-500">(tùy chọn)</span>
          <textarea name="note" maxLength={1000} rows={2} value={shipping.note}
            onChange={(event) => setShipping({ ...shipping, note: event.target.value })}
            className="mt-2 w-full resize-y rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:border-black" placeholder="Hướng dẫn giao hàng nếu có" />
        </label>
      </fieldset>
      <button type="submit" disabled={loading || !items.length} className="mt-5 h-12 w-full rounded-full bg-black font-medium text-white transition-colors hover:bg-[#383838] disabled:cursor-wait disabled:opacity-50">
        {loading ? 'Đang tạo đơn hàng...' : 'Xác nhận đặt hàng'}
      </button>
    </form> : <button type="button" onClick={openShipping} disabled={!items.length}
      className="mt-6 h-12 w-full rounded-full bg-black font-medium text-white transition-colors hover:bg-[#383838] disabled:cursor-wait disabled:opacity-50">
      Thanh toán
    </button>}
    <p className="mt-2 text-center text-xs text-gray-500">Cần đăng nhập để xác nhận đặt hàng. Đơn được tạo trực tiếp, chưa thu tiền.</p>
    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
  </>;
}
