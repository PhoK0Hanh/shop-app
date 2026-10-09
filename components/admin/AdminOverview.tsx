"use client";
import { useState } from 'react';
import Link from 'next/link';
import { RefreshCw,ArrowUpRight } from 'lucide-react';
import { useApi } from '@/lib/use-api';
import { formatPrice } from '@/lib/catalog';
import { getColorLabel } from '@/lib/catalog-labels';
import { orderStatusLabels,type OrderStatus } from '@/lib/order-types';
import type { AdminOverview as Overview,OverviewRange } from '@/lib/admin-overview-types';
import ApiStatus from '@/components/ApiStatus';

export default function AdminOverview(){
  const [range,setRange]=useState<OverviewRange>('30d');
  const result=useApi<Overview>(`/admin/overview?range=${range}`);
  const data=result.data;
  // Biểu đồ lấy số đơn từ API, bao gồm các đơn mẫu đã seed vào database.
  const chartDays=data?.days??[];
  const chartMax=Math.max(1,...chartDays.map(day=>day.count));
  function ordersLink(status?:OrderStatus,date?:string){const query=new URLSearchParams({from:date??data!.from,to:date??data!.to});if(status)query.set('status',status);return `/admin/orders?${query}`;}
  // Biểu đồ có thể bấm từng ngày để mở danh sách tương ứng, không thêm thư viện chart.
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-semibold">Tình hình cửa hàng</h2><p className="mt-1 text-sm text-gray-500">Theo dõi đơn hàng và các việc cần xử lý.</p></div><div className="flex items-center gap-3"><select value={range} onChange={e=>setRange(e.target.value as OverviewRange)} className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"><option value="7d">7 ngày gần đây</option><option value="30d">30 ngày gần đây</option><option value="month">Tháng này</option></select><button title="Tải lại tổng quan" onClick={result.retry} className="rounded-lg border border-gray-300 bg-white p-3"><RefreshCw size={17}/></button></div></div>
    {!data?<ApiStatus error={result.error} retry={result.retry}/>:<>
      <p className="text-xs text-gray-500">Kỳ đơn hàng: {data.from} – {data.to} (UTC+7). Thống kê theo ngày đặt và trạng thái hiện tại.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{(['preparing','shipping','delivered'] as OrderStatus[]).map(status=><Link key={status} href={ordersLink(status)} className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-black"><div className="flex justify-between text-gray-500"><p className="text-sm">{orderStatusLabels[status]}</p><ArrowUpRight size={17}/></div><p className="mt-3 text-3xl font-semibold">{data.orders[status]}</p></Link>)}<div className="rounded-2xl border border-gray-200 bg-black p-5 text-white"><p className="text-sm text-gray-300">Giá trị đơn giao thành công</p><p className="mt-3 text-2xl font-semibold">{formatPrice(data.orders.deliveredValue)}</p><p className="mt-2 text-xs text-gray-400">Giá trị sản phẩm, chưa xác nhận tiền thực thu.</p></div></div>
      <div className="flex flex-wrap gap-4 text-sm"><Link href={ordersLink()} className="text-gray-600 hover:underline">Tổng đơn: <b>{data.orders.total}</b></Link><Link href={ordersLink('cancelled')} className="text-gray-600 hover:underline">Đã hủy: <b>{data.orders.cancelled}</b></Link></div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5"><h3 className="font-semibold">Số đơn theo ngày</h3><p className="mt-2 text-xs text-gray-500">Bao gồm mọi trạng thái. Bấm cột để xem đơn của ngày đó.</p>
          <div className="mt-6 overflow-x-auto"><div className="flex h-52 items-end gap-2 border-b border-gray-200 pb-1" style={{minWidth:`${Math.max(320,chartDays.length*28)}px`}}>{chartDays.map(day=>{
            const className="group flex h-full min-w-5 flex-1 flex-col justify-end text-center";
            const content=<><span className="mb-1 text-[10px] text-gray-500">{day.count}</span><span className="mx-auto block w-full max-w-8 rounded-t bg-black transition-colors group-hover:bg-gray-500" style={{height:`${Math.max(day.count?4:1,day.count/chartMax*160)}px`}}/><span className="mt-2 whitespace-nowrap text-[9px] text-gray-400">{day.date.slice(8)}</span></>;
            return <Link key={day.date} href={ordersLink(undefined,day.date)} title={`${day.date}: ${day.count} đơn`} className={className}>{content}</Link>;
          })}</div></div>
          <div className="mt-3 flex justify-between text-xs text-gray-400"><span>{data.from}</span><span>{data.to}</span></div>
        </section>
        <section className="rounded-2xl border border-gray-200 bg-white p-5"><h3 className="font-semibold">Tồn kho cần chú ý <span className="text-sm font-normal text-gray-500">({data.lowStockCount})</span></h3><p className="mt-1 text-xs text-gray-500">Biến thể đang bán còn ≤ 5 sản phẩm; hiển thị tối đa 10.</p><div className="mt-4 max-h-72 divide-y divide-gray-100 overflow-y-auto">{data.lowStock.map(item=><Link key={item.id} href={`/admin/products?search=${encodeURIComponent(item.productId)}&variants=${encodeURIComponent(item.productId)}`} className="flex items-center justify-between gap-3 py-3 hover:bg-gray-50"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-gray-500">{getColorLabel(item.color)} / {item.size}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs ${item.stock===0?'bg-red-50 text-red-600':'bg-amber-50 text-amber-700'}`}>{item.stock===0?'Hết hàng':`Còn ${item.stock}`}</span></Link>)}</div>{!data.lowStock.length&&<p className="py-8 text-center text-sm text-gray-500">Không có biến thể sắp hết hàng.</p>}</section>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[
        ['Tổng sản phẩm',data.products.total,'/admin/products'],['Đang bán',data.products.active,'/admin/products?status=active'],['Đã ẩn',data.products.hidden,'/admin/products?status=hidden'],['Khách hàng',data.customers.total,'/admin/users?role=customer'],['Khách hàng bị khóa',data.customers.locked,'/admin/users?role=customer&status=locked'],
      ].map(([label,value,href])=><Link key={label} href={String(href)} className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-black"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-2 text-[10px] text-gray-400">Trạng thái hiện tại</p></Link>)}</div>
      <section className="rounded-2xl border border-gray-200 bg-white"><div className="flex items-center justify-between border-b border-gray-200 p-5"><h3 className="font-semibold">Đơn mới nhất trong kỳ</h3><Link href={ordersLink()} className="text-sm text-gray-500 hover:underline">Xem tất cả</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr>{['Mã đơn','Người nhận','Ngày đặt','Tổng tiền','Trạng thái'].map(label=><th key={label} className="px-5 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{data.recent.map(order=><tr key={order.id}><td className="px-5 py-4"><Link href={`/admin/orders?order=${encodeURIComponent(order.id)}`} title={order.id} className="block max-w-32 truncate font-mono text-xs hover:underline">{order.id}</Link></td><td className="px-5 py-4">{order.recipient}</td><td className="px-5 py-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString('vi-VN',{timeZone:'Asia/Bangkok'})}</td><td className="px-5 py-4 font-medium">{formatPrice(order.total)}</td><td className="px-5 py-4">{orderStatusLabels[order.status]}</td></tr>)}</tbody></table></div>{!data.recent.length&&<p className="p-8 text-center text-sm text-gray-500">Chưa có đơn trong kỳ này.</p>}</section>
    </>}
  </div>;
}
