"use client";
import { useRef,useState } from 'react';
import axios from 'axios';
import { Search,RefreshCw,LockKeyhole,LockKeyholeOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import type { AdminUser } from '@/lib/admin-user-types';
import ApiStatus from '@/components/ApiStatus';

export default function AdminUsers({initialRole='',initialStatus=''}:{initialRole?:string;initialStatus?:string}){
  const catalog=useApi<{users:AdminUser[];currentUserId:string}>('/admin/users');
  // Nhận bộ lọc từ liên kết thống kê ở trang Tổng quan.
  const [search,setSearch]=useState('');const [role,setRole]=useState(initialRole);const [status,setStatus]=useState(initialStatus);const [page,setPage]=useState(1);
  const [busy,setBusy]=useState(false);const pending=useRef(false);const [error,setError]=useState('');const [message,setMessage]=useState('');
  async function change(user:AdminUser){
    if(pending.current)return;
    const isActive=!user.isActive;
    if(!window.confirm(`${isActive?'Mở khóa':'Khóa'} tài khoản ${user.email}?${isActive?'':' Người dùng sẽ không thể sử dụng các chức năng yêu cầu đăng nhập trên website.'}`))return;
    pending.current=true;setBusy(true);setError('');setMessage('');
    try{await api.patch(`/admin/users/${encodeURIComponent(user.id)}`,{isActive});setMessage(isActive?'Đã mở khóa tài khoản.':'Đã khóa tài khoản trên website.');catalog.retry();}
    catch(error){setError(axios.isAxiosError<{error?:string}>(error)?error.response?.data?.error??'Không cập nhật được tài khoản. Vui lòng thử lại.':'Không cập nhật được tài khoản. Vui lòng thử lại.');}
    finally{pending.current=false;setBusy(false);}
  }
  const data=catalog.data;if(!data)return <ApiStatus error={catalog.error} retry={catalog.retry}/>;
  // Danh sách lấy từ hồ sơ PostgreSQL đã đồng bộ Firebase, bao gồm cả hồ sơ cũ.
  const filtered=data.users.filter(user=>(!role||user.role===role)&&(!status||user.isActive===(status==='active'))&&`${user.id} ${user.name} ${user.email}`.toLowerCase().includes(search.trim().toLowerCase()));
  const pages=Math.max(1,Math.ceil(filtered.length/10));const currentPage=Math.min(page,pages);const users=filtered.slice((currentPage-1)*10,currentPage*10);
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-3">{[['Tổng tài khoản',data.users.length],['Đang hoạt động',data.users.filter(u=>u.isActive).length],['Đã khóa',data.users.filter(u=>!u.isActive).length]].map(([label,value])=><div key={label} className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}</div>
    <section className="rounded-2xl border border-gray-200 bg-white">
      <div className="space-y-4 border-b border-gray-200 p-5"><div><h2 className="font-semibold">Danh sách tài khoản</h2><p className="mt-1 text-sm text-gray-500">Hồ sơ người dùng đã được đồng bộ với website.</p></div>
        <div className="flex flex-wrap gap-3"><label className="relative min-w-56 flex-1"><Search size={17} className="absolute left-3 top-3 text-gray-400"/><input value={search} disabled={busy} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Tìm tên, email hoặc mã tài khoản..." className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-black"/></label>
          <select value={role} disabled={busy} onChange={e=>{setRole(e.target.value);setPage(1);}} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">Tất cả vai trò</option><option value="customer">Khách hàng</option><option value="admin">Quản trị viên</option></select>
          <select value={status} disabled={busy} onChange={e=>{setStatus(e.target.value);setPage(1);}} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">Mọi trạng thái</option><option value="active">Đang hoạt động</option><option value="locked">Đã khóa</option></select>
          <button title="Tải lại danh sách" disabled={busy} onClick={()=>{setError('');catalog.retry();}} className="rounded-lg border border-gray-300 px-3 hover:bg-gray-50"><RefreshCw size={17}/></button>
        </div>{error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}{message&&<p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</p>}
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500"><tr>{['Mã tài khoản','Họ tên','Email','Vai trò','Firebase','Ngày tạo','Số đơn','Trạng thái','Thao tác'].map(label=><th key={label} className="px-4 py-4 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{users.map(user=><tr key={user.id} className="hover:bg-gray-50/60"><td className="px-4 py-5"><span title={user.id} className="block max-w-28 truncate font-mono text-xs">{user.id}</span></td><td className="px-4 py-5 font-medium">{user.name}{user.id===data.currentUserId&&<span className="ml-2 text-xs font-normal text-gray-400">(Bạn)</span>}</td><td className="px-4 py-5"><span title={user.email} className="block max-w-56 truncate">{user.email}</span></td><td className="px-4 py-5"><span className={`rounded-full px-3 py-1 text-xs ${user.role==='admin'?'bg-black text-white':'bg-gray-100 text-gray-600'}`}>{user.role==='admin'?'Quản trị viên':'Khách hàng'}</span></td><td className="px-4 py-5 text-xs text-gray-500">{user.firebaseLinked?'Đã liên kết':'Hồ sơ cũ'}</td><td className="whitespace-nowrap px-4 py-5 text-gray-500">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td><td className="px-4 py-5">{user.orderCount}</td><td className="px-4 py-5"><span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${user.isActive?'bg-green-50 text-green-700':'bg-red-50 text-red-600'}`}>{user.isActive?'Đang hoạt động':'Đã khóa'}</span></td><td className="px-4 py-5"><button disabled={busy||user.id===data.currentUserId} title={user.id===data.currentUserId?'Không thể khóa tài khoản đang sử dụng':user.isActive?'Khóa tài khoản':'Mở khóa tài khoản'} onClick={()=>change(user)} className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-xs disabled:opacity-30 ${user.isActive?'border-red-200 text-red-600 hover:bg-red-50':'border-gray-300 hover:bg-gray-50'}`}>{user.isActive?<LockKeyhole size={15}/>:<LockKeyholeOpen size={15}/>} {user.isActive?'Khóa':'Mở khóa'}</button></td></tr>)}</tbody></table></div>
      {!users.length&&<p className="p-10 text-center text-sm text-gray-500">Không có tài khoản phù hợp.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-5 text-sm"><span className="text-gray-500">{filtered.length} tài khoản · 10 tài khoản / trang</span><div className="flex items-center gap-3"><button disabled={currentPage===1||busy} onClick={()=>setPage(currentPage-1)} className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-30">Trước</button><span>{currentPage} / {pages}</span><button disabled={currentPage===pages||busy} onClick={()=>setPage(currentPage+1)} className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-30">Sau</button></div></div>
    </section>
  </div>;
}
