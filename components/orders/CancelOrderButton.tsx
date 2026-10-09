"use client";

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { api } from '@/lib/api';

export default function CancelOrderButton({ id, onCancelled }: { id: string; onCancelled: () => void }) {
  const router = useRouter();
  const pending = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function cancel() {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError('');
    try {
      // Server xác định chủ đơn, kiểm tra trạng thái và hoàn kho trong một transaction.
      await api.post(`/orders/${encodeURIComponent(id)}/cancel`);
      onCancelled();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) router.push('/login?next=%2Forders');
      else setError(axios.isAxiosError<{ error?: string }>(error) && error.response?.data?.error
        ? error.response.data.error : 'Chưa xác nhận được việc hủy đơn. Vui lòng thử lại.');
    } finally { pending.current = false; setLoading(false); }
  }
  return <div className="mt-4 border-t border-gray-100 pt-4">
    {confirming ? <>
      <p className="mb-3 text-sm text-gray-600">Bạn muốn hủy đơn hàng này?</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={cancel} disabled={loading} className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
          {loading ? 'Đang hủy...' : 'Xác nhận hủy'}
        </button>
        <button type="button" onClick={() => { setConfirming(false); setError(''); }} disabled={loading} className="rounded-full border border-gray-300 px-5 py-2 text-sm hover:bg-gray-100 disabled:opacity-50">Giữ đơn hàng</button>
      </div>
    </> : <button type="button" onClick={() => setConfirming(true)} className="rounded-full border border-red-200 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Hủy đơn</button>}
    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
  </div>;
}
