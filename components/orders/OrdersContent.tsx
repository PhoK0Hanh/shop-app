"use client";

import Link from 'next/link';
import { useApi } from '@/lib/use-api';
import { formatPrice } from '@/lib/catalog';
import { getColorLabel,getProductNameLabel } from '@/lib/catalog-labels';
import { orderStatusLabels, type Order } from '@/lib/order-types';
import ApiStatus from '@/components/ApiStatus';
import CancelOrderButton from '@/components/orders/CancelOrderButton';

export default function OrdersContent() {
  // API trả snapshot của đơn, không ghép lại bằng giá hiện tại từ catalog.
  const { data, error, retry } = useApi<{ orders: Order[] }>('/orders');
  if (!data) return <ApiStatus error={error} retry={retry} />;
  if (!data.orders.length) return <div className="rounded-3xl border border-gray-200 p-10 text-center">
    <p>Bạn chưa có đơn hàng nào.</p><Link href="/shop" className="mt-4 inline-block underline">Tiếp tục mua sắm</Link>
  </div>;
  return <div className="space-y-6">
    {data.orders.map((order) => <article key={order.id} className="rounded-3xl border border-gray-200 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 pb-4">
        <div><h2 className="break-all font-semibold">Đơn #{order.id}</h2>
          <p className="mt-1 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-medium ${order.status === 'cancelled' ? 'bg-gray-100 text-gray-600' : order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'shipping' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
          {orderStatusLabels[order.status]}
        </span>
      </div>
      {/* Hiển thị snapshot giao hàng; đơn cũ chưa có dữ liệu được ghi rõ. */}
      <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
        <h3 className="mb-2 font-semibold">Thông tin giao hàng</h3>
        {order.shipping ? <div className="space-y-1 wrap-break-word">
          <p>{order.shipping.recipientName} · {order.shipping.phone}</p>
          <p className="whitespace-pre-wrap text-gray-600">{order.shipping.address}</p>
          {order.shipping.note && <p className="whitespace-pre-wrap text-gray-600">Ghi chú: {order.shipping.note}</p>}
        </div> : <p className="text-gray-500">Đơn cũ chưa có thông tin giao hàng.</p>}
      </div>
      <div className="divide-y divide-gray-100">{order.items.map((item) => <div key={item.id} className="flex flex-wrap justify-between gap-3 py-4">
        <div><p className="font-medium">{getProductNameLabel(item.productName)}</p><p className="mt-1 text-sm text-gray-500">{getColorLabel(item.color)} · {item.size} · Số lượng: {item.quantity}</p>
          <p className="mt-1 text-sm">{formatPrice(item.unitPrice)} / sản phẩm</p>
        </div><p className="font-semibold">{formatPrice(item.unitPrice * item.quantity)}</p>
      </div>)}</div>
      <p className="border-t border-gray-200 pt-4 text-right text-lg font-bold">Tổng: {formatPrice(order.total)}</p>
      {/* Chỉ đơn đang chuẩn bị có nút hủy; API kiểm tra lại để tránh dữ liệu UI cũ. */}
      {order.status === 'preparing' && <CancelOrderButton id={order.id} onCancelled={retry} />}
    </article>)}
  </div>;
}
