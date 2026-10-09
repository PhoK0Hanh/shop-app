"use client";
import { useEffect,useRef,useState } from 'react';
import axios from 'axios';
import { Search,RefreshCw,X } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { formatPrice } from '@/lib/catalog';
import { getColorLabel,getProductNameLabel } from '@/lib/catalog-labels';
import { orderStatusLabels,type OrderStatus } from '@/lib/order-types';
import type { AdminOrder } from '@/lib/admin-order-types';
import ApiStatus from '@/components/ApiStatus';

const badge:Record<OrderStatus,string>={preparing:'bg-amber-50 text-amber-700',shipping:'bg-blue-50 text-blue-700',delivered:'bg-green-50 text-green-700',cancelled:'bg-gray-100 text-gray-500'};
function Status({status}:{status:OrderStatus}){return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${badge[status]}`}>{orderStatusLabels[status]}</span>;}
function Actions({order,busy,onChange}:{order:AdminOrder;busy:boolean;onChange:(order:AdminOrder,status:OrderStatus)=>void}){
  // Chỉ hiển thị các bước tiếp theo; server vẫn kiểm tra trạng thái mới nhất.
  return <div className="flex flex-wrap gap-2">
    {order.status==='preparing'&&<><button disabled={busy} onClick={()=>onChange(order,'shipping')} className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white disabled:opacity-40">Bắt đầu giao</button><button disabled={busy} onClick={()=>onChange(order,'cancelled')} className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600 disabled:opacity-40">Hủy đơn</button></>}
    {order.status==='shipping'&&<button disabled={busy} onClick={()=>onChange(order,'delivered')} className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white disabled:opacity-40">Giao thành công</button>}
  </div>;
}
function OrderDialog({order,busy,error,onChange,onClose}:{order:AdminOrder;busy:boolean;error:string;onChange:(order:AdminOrder,status:OrderStatus)=>void;onClose:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{ref.current?.showModal();},[]);
  return <dialog ref={ref} onCancel={event=>{if(busy)event.preventDefault();else onClose();}} className="m-auto w-[min(800px,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-black/40">
    <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5"><div><h2 className="text-lg font-semibold">Chi tiết đơn hàng</h2><p className="mt-1 break-all font-mono text-xs text-gray-500">{order.id}</p></div><button title="Đóng" disabled={busy} onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-40"><X size={20}/></button></div>
    <div className="max-h-[65vh] space-y-5 overflow-auto p-5">
      <div className="flex flex-wrap justify-between gap-3"><p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</p><Status status={order.status}/></div>
      <div className="grid gap-4 sm:grid-cols-2"><section className="rounded-xl bg-gray-50 p-4 text-sm"><h3 className="mb-2 font-semibold">Tài khoản đặt hàng</h3><p>{order.customerName}</p><p className="mt-1 break-all text-gray-500">{order.customerEmail}</p></section><section className="rounded-xl bg-gray-50 p-4 text-sm"><h3 className="mb-2 font-semibold">Thông tin giao hàng</h3>{order.shipping?<div className="space-y-1 wrap-break-word"><p>{order.shipping.recipientName}</p><p>{order.shipping.phone}</p><p className="whitespace-pre-wrap text-gray-600">{order.shipping.address}</p>{order.shipping.note&&<p className="whitespace-pre-wrap text-gray-600">Ghi chú: {order.shipping.note}</p>}</div>:<p className="text-gray-500">Đơn cũ chưa có thông tin giao hàng.</p>}</section></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead className="border-b border-gray-200 text-xs text-gray-500"><tr>{['Sản phẩm','Màu / Kích cỡ','Số lượng','Đơn giá','Thành tiền'].map(label=><th key={label} className="pb-3 pr-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{order.items.map(item=><tr key={item.id}><td className="py-3 pr-3 font-medium">{getProductNameLabel(item.productName)}</td><td className="pr-3">{getColorLabel(item.color)} / {item.size}</td><td>{item.quantity}</td><td className="whitespace-nowrap pr-3">{formatPrice(item.unitPrice)}</td><td className="whitespace-nowrap font-medium">{formatPrice(item.quantity*item.unitPrice)}</td></tr>)}</tbody></table></div>
      <p className="border-t border-gray-200 pt-4 text-right text-lg font-bold">Tổng: {formatPrice(order.total)}</p>
      {error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-5"><Actions order={order} busy={busy} onChange={onChange}/><button disabled={busy} onClick={onClose} className="rounded-full border border-gray-300 px-5 py-2 text-sm disabled:opacity-40">Đóng</button></div>
  </dialog>;
}

export default function AdminOrders({initialStatus='',initialFrom='',initialTo='',initialOrderId=''}:{initialStatus?:string;initialFrom?:string;initialTo?:string;initialOrderId?:string}){
  const catalog=useApi<{orders:AdminOrder[]}>('/admin/orders');
  const [search,setSearch]=useState('');const [status,setStatus]=useState(initialStatus);const [page,setPage]=useState(1);const [selected,setSelected]=useState<AdminOrder|null>(null);
  const [from,setFrom]=useState(initialFrom);const [to,setTo]=useState(initialTo);const [initialDialogOpen,setInitialDialogOpen]=useState(Boolean(initialOrderId));
  const [busy,setBusy]=useState(false);const pending=useRef(false);const [error,setError]=useState('');const [message,setMessage]=useState('');
  async function change(order:AdminOrder,target:OrderStatus){
    if(pending.current)return;
    const prompt=target==='cancelled'?'Hủy đơn này và hoàn lại tồn kho?':`Chuyển đơn này sang “${orderStatusLabels[target]}”?`;
    if(!window.confirm(prompt))return;
    pending.current=true;setBusy(true);setError('');setMessage('');
    try{await api.patch(`/admin/orders/${encodeURIComponent(order.id)}`,{status:target});setSelected(null);setInitialDialogOpen(false);setMessage(`Đã chuyển đơn sang ${orderStatusLabels[target]}.`);catalog.retry();}
    catch(error){setError(axios.isAxiosError<{error?:string}>(error)?error.response?.data?.error??'Không cập nhật được đơn. Vui lòng thử lại.':'Không cập nhật được đơn. Vui lòng thử lại.');}
    finally{pending.current=false;setBusy(false);}
  }
  const data=catalog.data;if(!data)return <ApiStatus error={catalog.error} retry={catalog.retry}/>;
  // Ngày lọc cùng UTC+7 với thống kê tổng quan, không theo timezone thiết bị.
  const dayOf=(date:string)=>new Date(date).toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'});
  const filtered=data.orders.filter(order=>(!status||order.status===status)&&(!from||dayOf(order.createdAt)>=from)&&(!to||dayOf(order.createdAt)<=to)&&`${order.id} ${order.customerName} ${order.customerEmail} ${order.shipping?.recipientName??''} ${order.shipping?.phone??''}`.toLowerCase().includes(search.trim().toLowerCase()));
  const displayedOrder=selected??(initialDialogOpen?data.orders.find(order=>order.id===initialOrderId):null);
  const pages=Math.max(1,Math.ceil(filtered.length/10));const currentPage=Math.min(page,pages);const orders=filtered.slice((currentPage-1)*10,currentPage*10);
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{(Object.keys(orderStatusLabels) as OrderStatus[]).map(value=><button key={value} disabled={busy} onClick={()=>{setStatus(value);setPage(1);}} className={`rounded-2xl border bg-white p-5 text-left transition-colors ${status===value?'border-black':'border-gray-200 hover:border-gray-400'}`}><p className="text-sm text-gray-500">{orderStatusLabels[value]}</p><p className="mt-2 text-3xl font-semibold">{data.orders.filter(order=>order.status===value).length}</p></button>)}</div>
    <section className="rounded-2xl border border-gray-200 bg-white">
      <div className="space-y-4 border-b border-gray-200 p-5"><div><h2 className="font-semibold">Danh sách đơn hàng</h2><p className="mt-1 text-sm text-gray-500">Xem thông tin giao hàng và cập nhật tiến trình xử lý đơn.</p></div>
        <div className="flex flex-wrap gap-3"><label className="relative min-w-56 flex-1"><Search size={17} className="absolute left-3 top-3 text-gray-400"/><input value={search} disabled={busy} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Tìm mã đơn, tên, email hoặc số điện thoại..." className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-black"/></label>
          <select value={status} disabled={busy} onChange={e=>{setStatus(e.target.value);setPage(1);}} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">Tất cả trạng thái</option>{(Object.keys(orderStatusLabels) as OrderStatus[]).map(value=><option key={value} value={value}>{orderStatusLabels[value]}</option>)}</select>
          <button title="Tải lại danh sách" disabled={busy} onClick={()=>{setSelected(null);setError('');catalog.retry();}} className="rounded-lg border border-gray-300 px-3 hover:bg-gray-50"><RefreshCw size={17}/></button>
        </div><div className="flex flex-wrap items-center gap-3 text-sm"><label>Từ ngày <input type="date" value={from} disabled={busy} onChange={e=>{setFrom(e.target.value);setPage(1);}} className="ml-2 rounded-lg border border-gray-300 px-3 py-2"/></label><label>Đến ngày <input type="date" value={to} disabled={busy} onChange={e=>{setTo(e.target.value);setPage(1);}} className="ml-2 rounded-lg border border-gray-300 px-3 py-2"/></label>{(from||to)&&<button disabled={busy} onClick={()=>{setFrom('');setTo('');setPage(1);}} className="text-gray-500 underline">Bỏ lọc ngày</button>}</div>{error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}{message&&<p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</p>}
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1150px] text-left text-sm"><thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500"><tr>{['Mã đơn','Người mua','Người nhận','Số sản phẩm','Tổng tiền','Ngày đặt','Trạng thái','Thao tác'].map(label=><th key={label} className="px-4 py-4 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{orders.map(order=><tr key={order.id} className="hover:bg-gray-50/60"><td className="px-4 py-5 align-top"><button disabled={busy} title={order.id} onClick={()=>{setSelected(order);setError('');}} className="max-w-32 truncate font-mono text-xs font-medium hover:underline">{order.id}</button></td><td className="px-4 py-5 align-top"><p className="font-medium">{order.customerName}</p><p className="mt-1 max-w-44 truncate text-xs text-gray-500" title={order.customerEmail}>{order.customerEmail}</p></td><td className="px-4 py-5 align-top"><p>{order.shipping?.recipientName??'—'}</p><p className="mt-1 text-xs text-gray-500">{order.shipping?.phone??''}</p></td><td className="px-4 py-5 align-top">{order.items.reduce((sum,item)=>sum+item.quantity,0)}</td><td className="whitespace-nowrap px-4 py-5 align-top font-medium">{formatPrice(order.total)}</td><td className="whitespace-nowrap px-4 py-5 align-top text-gray-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td><td className="px-4 py-5 align-top"><Status status={order.status}/></td><td className="px-4 py-5 align-top"><div className="space-y-2"><button disabled={busy} onClick={()=>{setSelected(order);setError('');}} className="rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:opacity-40">Chi tiết</button><Actions order={order} busy={busy} onChange={change}/></div></td></tr>)}</tbody></table></div>
      {!orders.length&&<p className="p-10 text-center text-sm text-gray-500">Không có đơn hàng phù hợp.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-5 text-sm"><span className="text-gray-500">{filtered.length} đơn · 10 đơn / trang</span><div className="flex items-center gap-3"><button disabled={currentPage===1||busy} onClick={()=>setPage(currentPage-1)} className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-30">Trước</button><span>{currentPage} / {pages}</span><button disabled={currentPage===pages||busy} onClick={()=>setPage(currentPage+1)} className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-30">Sau</button></div></div>
    </section>
    {displayedOrder&&<OrderDialog order={displayedOrder} busy={busy} error={error} onChange={change} onClose={()=>{setSelected(null);setInitialDialogOpen(false);}}/>}
  </div>;
}
