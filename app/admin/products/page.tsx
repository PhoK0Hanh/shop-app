import AdminProducts from '@/components/admin/AdminProducts';
export const metadata={title:'Quản lý sản phẩm | SHOP.CO'};
// Liên kết cảnh báo kho truyền ID sản phẩm để mở đúng popup biến thể.
export default async function AdminProductsPage({searchParams}:{searchParams:Promise<{search?:string;status?:string;variants?:string}>}){
  const query=await searchParams;return <AdminProducts key={JSON.stringify(query)} initialSearch={typeof query.search==='string'?query.search:''} initialStatus={query.status==='active'||query.status==='hidden'?query.status:''} initialVariantId={typeof query.variants==='string'?query.variants:''}/>;
}
