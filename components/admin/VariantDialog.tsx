"use client";
import { useEffect,useRef } from 'react';
import { X,Plus,Trash2 } from 'lucide-react';
import type { AdminVariant } from '@/lib/admin-product-types';
import type { Color,Size } from '@/lib/catalog';
import { getColorLabel } from '@/lib/catalog-labels';

const colors:Color[]=['Black','White','Gray','Navy','Blue','Beige','Green','Burgundy'];
const sizes:Size[]=['S','M','L','XL','XXL'];
export default function VariantDialog({name,variants,onChange,onClose}:{name:string;variants:AdminVariant[];onChange?:(value:AdminVariant[])=>void;onClose:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{ref.current?.showModal();},[]);
  function change(index:number,patch:Partial<AdminVariant>){onChange?.(variants.map((v,i)=>i===index?{...v,...patch}:v));}
  // Dialog giữ focus và Escape tự nhiên; thay đổi chỉ nằm trong bản nháp sản phẩm.
  return <dialog ref={ref} onCancel={onClose} className="m-auto w-[min(720px,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-black/40">
    <div className="flex items-center justify-between border-b border-gray-200 p-5"><div><h2 className="text-lg font-semibold">Biến thể và tồn kho</h2><p className="mt-1 text-sm text-gray-500">{name||'Sản phẩm mới'}</p></div><button type="button" title="Đóng" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100"><X size={20}/></button></div>
    <div className="max-h-[60vh] overflow-auto p-5"><table className="w-full text-left text-sm"><thead className="text-gray-500"><tr><th className="pb-3">Màu</th><th>Kích cỡ</th><th>Số lượng</th><th>Hoạt động</th>{onChange&&<th>Thao tác</th>}</tr></thead>
      <tbody>{variants.map((v,index)=><tr key={v.id||`new-${index}`} className="border-t border-gray-100">
        <td className="py-3 pr-3">{onChange?<select disabled={v.hasOrders} value={v.color} onChange={e=>change(index,{color:e.target.value as Color})} className="rounded-lg border border-gray-200 p-2 disabled:bg-gray-50">{colors.map(c=><option key={c} value={c}>{getColorLabel(c)}</option>)}</select>:getColorLabel(v.color)}</td>
        <td className="pr-3">{onChange?<select disabled={v.hasOrders} value={v.size} onChange={e=>change(index,{size:e.target.value as Size})} className="rounded-lg border border-gray-200 p-2 disabled:bg-gray-50">{sizes.map(s=><option key={s}>{s}</option>)}</select>:v.size}</td>
        <td className="pr-3">{onChange?<input type="number" min={0} step={1} value={v.stock} onChange={e=>change(index,{stock:Number(e.target.value)})} className="w-24 rounded-lg border border-gray-200 p-2"/>:v.stock}</td>
        <td>{onChange?<input type="checkbox" checked={v.isActive} onChange={e=>change(index,{isActive:e.target.checked})}/>:v.isActive?'Có':'Đã ngừng'}</td>
        {onChange&&<td><button type="button" title={v.hasOrders?'Ngừng sử dụng biến thể đã có đơn':'Xóa biến thể'} onClick={()=>v.hasOrders?change(index,{isActive:false}):onChange(variants.filter((_,i)=>i!==index))} className="rounded-lg p-2 text-red-600 hover:bg-red-50">{v.hasOrders?'Ngừng':<Trash2 size={16}/>}</button></td>}
      </tr>)}</tbody></table>
      {!variants.length&&<p className="py-5 text-center text-sm text-gray-500">Chưa có biến thể.</p>}
    </div>
    <div className="border-t border-gray-200 p-5">{onChange&&<><button type="button" onClick={()=>{const used=new Set(variants.map(v=>`${v.color}:${v.size}`));const combination=colors.flatMap(color=>sizes.map(size=>({color,size}))).find(v=>!used.has(`${v.color}:${v.size}`));if(combination)onChange([...variants,{...combination,id:'',stock:0,isActive:true,hasOrders:false}]);}} disabled={variants.length>=40} className="mb-3 flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"><Plus size={16}/>Thêm biến thể</button>
      <p className="mb-4 text-xs text-gray-500">Bấm Lưu ở hàng sản phẩm để ghi thay đổi. Biến thể có đơn không được đổi màu/kích cỡ hoặc xóa; có thể ngừng sử dụng.</p></>}
      <button type="button" onClick={onClose} className="rounded-full bg-black px-6 py-2 text-sm font-medium text-white">Đóng</button>
    </div>
  </dialog>;
}
