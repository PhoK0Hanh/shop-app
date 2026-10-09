"use client";
import { useRef,useState } from 'react';
import axios from 'axios';
import { Plus,Search,RefreshCw,Package } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { formatPrice } from '@/lib/catalog';
import type { Category,Style } from '@/lib/catalog';
import type { AdminProduct,ProductDraft } from '@/lib/admin-product-types';
import VariantDialog from './VariantDialog';
import ApiStatus from '@/components/ApiStatus';

type Catalog={products:AdminProduct[];categories:Category[];styles:Style[]};
const field='w-full min-w-24 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm outline-none focus:border-black';
export default function AdminProducts({initialSearch='',initialStatus='',initialVariantId=''}:{initialSearch?:string;initialStatus?:string;initialVariantId?:string}){
  const catalog=useApi<Catalog>('/admin/products');
  const [search,setSearch]=useState(initialSearch);const [category,setCategory]=useState('');const [style,setStyle]=useState('');const [status,setStatus]=useState(initialStatus);const [page,setPage]=useState(1);
  const [initialPopupOpen,setInitialPopupOpen]=useState(Boolean(initialVariantId));
  const [draft,setDraft]=useState<ProductDraft|null>(null);const [variantProduct,setVariantProduct]=useState<AdminProduct|null>(null);const [editVariants,setEditVariants]=useState(false);
  const [busy,setBusy]=useState(false);const pending=useRef(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
  function patch(value:Partial<ProductDraft>){setDraft(current=>current?{...current,...value}:null);}
  function start(product?:AdminProduct){
    setError('');setMessage('');
    setDraft(product?structuredClone(product):{id:'',version:'',name:'',description:'',originalPrice:1,images:[],categoryId:catalog.data?.categories[0]?.id??'',styleIds:[],isActive:false,variants:[]});
  }
  async function mutate(action:()=>Promise<unknown>,success:string){
    if(pending.current)return;pending.current=true;setBusy(true);setError('');setMessage('');
    try{await action();setDraft(null);setEditVariants(false);setVariantProduct(null);setMessage(success);catalog.retry();}
    catch(error){setError(axios.isAxiosError<{error?:string}>(error)?error.response?.data?.error??'Không lưu được dữ liệu. Vui lòng thử lại.':'Không lưu được dữ liệu. Vui lòng thử lại.');}
    finally{pending.current=false;setBusy(false);}
  }
  function save(){if(draft)void mutate(()=>draft.id?api.put(`/admin/products/${encodeURIComponent(draft.id)}`,draft):api.post('/admin/products',draft),'Đã lưu sản phẩm.');}
  // Dữ liệu admin đọc qua API riêng; mỗi lần chỉ có một hàng chỉnh sửa.
  const data=catalog.data;
  if(!data)return <ApiStatus error={catalog.error} retry={catalog.retry}/>;
  // Liên kết cảnh báo tồn kho mở popup đọc biến thể ngay khi dữ liệu tải xong.
  const displayedVariantProduct=variantProduct??(initialPopupOpen?data.products.find(p=>p.id===initialVariantId):undefined);
  const filtered=data.products.filter(p=>(`${p.name} ${p.id}`.toLowerCase().includes(search.trim().toLowerCase()))&&(!category||p.categoryId===category)&&(!style||p.styleIds.includes(style))&&(!status||p.isActive===(status==='active')));
  const pages=Math.max(1,Math.ceil(filtered.length/10));const currentPage=Math.min(page,pages);
  const products=filtered.slice((currentPage-1)*10,currentPage*10);
  const rows:(AdminProduct|ProductDraft)[]=draft&&!draft.id?[draft,...products]:products;
  function filterChanged(update:()=>void){if(draft)return;update();setPage(1);}
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-3">{[
      ['Tổng sản phẩm',data.products.length],['Đang bán',data.products.filter(p=>p.isActive).length],['Đã ẩn',data.products.filter(p=>!p.isActive).length],
    ].map(([label,value])=><div key={label} className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}</div>
    <section className="rounded-2xl border border-gray-200 bg-white">
      <div className="space-y-4 border-b border-gray-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Danh sách sản phẩm</h2><p className="mt-1 text-sm text-gray-500">Quản lý thông tin, giá và tồn kho sản phẩm.</p></div><button type="button" disabled={Boolean(draft)||busy} onClick={()=>start()} className="flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"><Plus size={17}/>Thêm sản phẩm</button></div>
        <div className="flex flex-wrap gap-3"><label className="relative min-w-56 flex-1"><Search size={17} className="absolute left-3 top-3 text-gray-400"/><input placeholder="Tìm tên / mã sản phẩm..." value={search} disabled={Boolean(draft)} onChange={e=>filterChanged(()=>setSearch(e.target.value))} className={`${field} pl-10`}/></label>
          <select value={category} disabled={Boolean(draft)} onChange={e=>filterChanged(()=>setCategory(e.target.value))} className={`${field} sm:w-40`}><option value="">Tất cả danh mục</option>{data.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select value={style} disabled={Boolean(draft)} onChange={e=>filterChanged(()=>setStyle(e.target.value))} className={`${field} sm:w-36`}><option value="">Tất cả phong cách</option>{data.styles.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <select value={status} disabled={Boolean(draft)} onChange={e=>filterChanged(()=>setStatus(e.target.value))} className={`${field} sm:w-40`}><option value="">Mọi trạng thái</option><option value="active">Đang bán</option><option value="hidden">Đã ẩn</option></select>
          <button type="button" disabled={busy} title="Tải lại dữ liệu" onClick={()=>{if(!draft||window.confirm('Bỏ bản nháp và tải lại dữ liệu?')){setDraft(null);catalog.retry();}}} className="rounded-lg border border-gray-300 px-3 hover:bg-gray-50 disabled:opacity-40"><RefreshCw size={17}/></button>
        </div>
        {draft&&<p className="text-xs text-gray-500">Đang sửa một sản phẩm. Bấm Lưu hoặc Hủy trước khi chuyển hàng hay bộ lọc.</p>}
        {error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}{message&&<p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</p>}
      </div>
      <fieldset disabled={busy} className="min-w-0 disabled:opacity-60"><div className="overflow-x-auto"><table className="w-full min-w-[1450px] text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500"><tr>{['Mã sản phẩm','Đường dẫn ảnh','Tên sản phẩm','Danh mục','Phong cách','Giá gốc','Giá giảm','Tồn kho','Trạng thái','Thao tác'].map(title=><th key={title} className="px-4 py-4 font-medium">{title}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">{rows.map(row=>{
          const editing=draft?.id===row.id;const p=editing?draft!:row;const existing=row as AdminProduct;
          return <tr key={row.id||'new'} className={editing?'bg-amber-50/40':'hover:bg-gray-50/60'}>
            <td className="max-w-32 px-4 py-5 align-top"><span className="block truncate font-mono text-xs" title={row.id}>{row.id||'Tự tạo khi lưu'}</span></td>
            <td className="w-56 px-4 py-5 align-top">{editing?<textarea rows={3} value={p.images.join('\n')} placeholder="Mỗi đường dẫn ảnh một dòng" onChange={e=>patch({images:e.target.value.split('\n')})} className={`${field} max-h-18 resize-none overflow-y-auto font-normal`}/>:<div className="max-h-18 overflow-y-auto leading-6">{p.images.map((url,i)=><a key={`${url}-${i}`} href={url} target="_blank" rel="noopener noreferrer" title={url} className="block max-w-48 truncate text-blue-600 hover:underline">{url}</a>)}</div>}</td>
            <td className="w-56 px-4 py-5 align-top">{editing?<><input value={p.name} maxLength={200} placeholder="Tên sản phẩm" onChange={e=>patch({name:e.target.value})} className={field}/><textarea rows={2} value={p.description} maxLength={10000} placeholder="Mô tả" onChange={e=>patch({description:e.target.value})} className={`${field} mt-2 resize-y`}/></>:<span className="font-medium">{p.name}</span>}</td>
            <td className="px-4 py-5 align-top">{editing?<select value={p.categoryId} onChange={e=>patch({categoryId:e.target.value})} className={field}>{data.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>:data.categories.find(c=>c.id===p.categoryId)?.name??'—'}</td>
            <td className="min-w-36 px-4 py-5 align-top">{editing?<details><summary className="cursor-pointer rounded-lg border border-gray-300 bg-white p-2">Chọn phong cách ({p.styleIds.length})</summary><div className="mt-2 space-y-2">{data.styles.map(s=><label key={s.id} className="flex gap-2"><input type="checkbox" checked={p.styleIds.includes(s.id)} onChange={e=>patch({styleIds:e.target.checked?[...p.styleIds,s.id]:p.styleIds.filter(id=>id!==s.id)})}/>{s.name}</label>)}</div></details>:<div className="flex flex-wrap gap-1">{p.styleIds.map(id=><span key={id} className="rounded-md bg-gray-100 px-2 py-1 text-xs">{data.styles.find(s=>s.id===id)?.name??id}</span>)}</div>}</td>
            <td className="px-4 py-5 align-top">{editing?<input type="number" min={1} step={1} value={p.originalPrice} onChange={e=>patch({originalPrice:Number(e.target.value)})} className={field}/>:<span className="whitespace-nowrap">{formatPrice(p.originalPrice)}</span>}</td>
            <td className="px-4 py-5 align-top">{editing?<input type="number" min={0} step={1} value={p.salePrice??''} placeholder="Không giảm" onChange={e=>patch({salePrice:e.target.value===''?undefined:Number(e.target.value)})} className={field}/>:<span className="whitespace-nowrap">{p.salePrice===undefined?'—':formatPrice(p.salePrice)}</span>}</td>
            <td className="px-4 py-5 align-top"><button type="button" onClick={()=>editing?setEditVariants(true):setVariantProduct(existing)} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:border-black"><Package size={15}/>{p.variants.filter(v=>v.isActive).reduce((sum,v)=>sum+v.stock,0)}</button><span className="mt-1 block text-xs text-gray-400">{p.variants.filter(v=>v.isActive).length} biến thể</span></td>
            <td className="px-4 py-5 align-top">{editing?<select value={String(p.isActive)} onChange={e=>patch({isActive:e.target.value==='true'})} className={field}><option value="true">Đang bán</option><option value="false">Đã ẩn</option></select>:<span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${p.isActive?'bg-green-50 text-green-700':'bg-gray-100 text-gray-500'}`}>{p.isActive?'Đang bán':'Đã ẩn'}</span>}</td>
            <td className="px-4 py-5 align-top"><div className="flex flex-wrap gap-2">{editing?<><button type="button" onClick={save} className="rounded-lg bg-black px-3 py-2 text-xs text-white">{busy?'Đang lưu...':'Lưu'}</button><button type="button" onClick={()=>{setDraft(null);setError('');setEditVariants(false);}} className="rounded-lg border border-gray-300 px-3 py-2 text-xs">Hủy</button></>:<>
              <button type="button" disabled={Boolean(draft)} onClick={()=>start(existing)} className="rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:opacity-40">Sửa</button>
              <button type="button" disabled={Boolean(draft)} onClick={()=>void mutate(()=>api.put(`/admin/products/${encodeURIComponent(existing.id)}`,{...existing,isActive:!existing.isActive}),existing.isActive?'Đã ẩn sản phẩm.':'Đã hiện sản phẩm.')} className="rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:opacity-40">{p.isActive?'Ẩn':'Hiện'}</button>
              <button type="button" disabled={Boolean(draft)||existing.hasOrders} title={existing.hasOrders?'Sản phẩm đã có đơn, hãy dùng Ẩn':'Xóa vĩnh viễn'} onClick={()=>{if(window.confirm(`Xóa vĩnh viễn sản phẩm "${p.name}"?`))void mutate(()=>api.delete(`/admin/products/${encodeURIComponent(existing.id)}`),'Đã xóa sản phẩm.');}} className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600 disabled:opacity-30">Xóa</button>
            </>}</div></td>
          </tr>;
        })}</tbody>
      </table></div></fieldset>
      {!rows.length&&<p className="p-10 text-center text-sm text-gray-500">Không có sản phẩm phù hợp.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-5 text-sm"><span className="text-gray-500">{filtered.length} sản phẩm · 10 sản phẩm / trang</span><div className="flex items-center gap-3"><button disabled={currentPage===1||Boolean(draft)||busy} onClick={()=>setPage(currentPage-1)} className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-30">Trước</button><span>{currentPage} / {pages}</span><button disabled={currentPage===pages||Boolean(draft)||busy} onClick={()=>setPage(currentPage+1)} className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-30">Sau</button></div></div>
    </section>
    {editVariants&&draft&&<VariantDialog name={draft.name} variants={draft.variants} onChange={variants=>patch({variants})} onClose={()=>setEditVariants(false)}/>}
    {displayedVariantProduct&&<VariantDialog name={displayedVariantProduct.name} variants={displayedVariantProduct.variants} onClose={()=>{setVariantProduct(null);setInitialPopupOpen(false);}}/>}
  </div>;
}
