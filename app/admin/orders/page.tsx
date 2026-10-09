import AdminOrders from '@/components/admin/AdminOrders';
export const metadata={title:'Quản lý đơn hàng | SHOP.CO'};
// Quyền trang được kiểm tra ở admin layout, quyền dữ liệu được kiểm tra tại API riêng.
export default async function AdminOrdersPage({searchParams}:{searchParams:Promise<{status?:string;from?:string;to?:string;order?:string}>}){
  const query=await searchParams;const date=(value:unknown)=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:'';
  return <AdminOrders key={JSON.stringify(query)} initialStatus={typeof query.status==='string'&&['preparing','shipping','delivered','cancelled'].includes(query.status)?query.status:''} initialFrom={date(query.from)} initialTo={date(query.to)} initialOrderId={typeof query.order==='string'?query.order:''}/>;
}
