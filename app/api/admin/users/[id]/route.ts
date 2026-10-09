import { NextRequest } from 'next/server';
import { adminResponse,readAdminBody } from '@/lib/admin-api';
import { parseAccountState,setAdminUserState } from '@/lib/admin-users';
export const runtime='nodejs';
// Role không nhận từ client; API chỉ khóa hoặc mở tài khoản theo isActive.
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  return adminResponse(request,async(adminId)=>{const {id}=await params;const isActive=parseAccountState(await readAdminBody(request));await setAdminUserState(adminId,id,isActive);return {id,isActive};});
}
