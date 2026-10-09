import AdminUsers from '@/components/admin/AdminUsers';
export const metadata={title:'Quản lý tài khoản | SHOP.CO'};
// Admin layout chặn trang; mỗi API kiểm tra lại quyền trước khi trả dữ liệu tài khoản.
export default async function AdminUsersPage({searchParams}:{searchParams:Promise<{role?:string;status?:string}>}){
  const query=await searchParams;
  const role=query.role==='customer'||query.role==='admin'?query.role:'';
  const status=query.status==='active'||query.status==='locked'?query.status:'';
  return <AdminUsers key={`${role}:${status}`} initialRole={role} initialStatus={status}/>;
}
