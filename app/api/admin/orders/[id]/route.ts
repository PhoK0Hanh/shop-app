import { NextRequest } from 'next/server';
import { adminResponse,readAdminBody } from '@/lib/admin-api';
import { changeAdminOrderStatus,parseAdminOrderStatus } from '@/lib/admin-orders';
export const runtime='nodejs';
// Chỉ cập nhật trạng thái, không cho sửa giá, người nhận hoặc sản phẩm của đơn.
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  return adminResponse(request,async(userId)=>{const {id}=await params;const status=parseAdminOrderStatus(await readAdminBody(request));await changeAdminOrderStatus(userId,id,status);return {id,status};});
}
