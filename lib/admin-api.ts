import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from './firebase/session';
import { AdminProductError } from './admin-products';
import { OrderError } from './orders';

// Mỗi API admin tự kiểm tra quyền; layout không thay thế kiểm tra API.
export async function adminResponse(request: NextRequest, action: (userId:string)=>Promise<unknown>) {
  try {
    if(request.method!=='GET' && request.headers.get('origin')!==request.nextUrl.origin) throw new AdminProductError('Nguồn yêu cầu không hợp lệ.',403);
    const user=await getSessionUser();
    if(!user) throw new AdminProductError('Vui lòng đăng nhập.',401);
    if(user.role!=='admin') throw new AdminProductError('Chỉ admin được truy cập.',403);
    return NextResponse.json(await action(user.id),{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    const known=error instanceof AdminProductError || error instanceof OrderError;
    return NextResponse.json({error:known?error.message:'Không xử lý được dữ liệu. Vui lòng thử lại.'},
      {status:known?error.status:500,headers:{'Cache-Control':'no-store'}});
  }
}
export async function readAdminBody(request:NextRequest) {
  if(!request.headers.get('content-type')?.includes('application/json')) throw new AdminProductError('Dữ liệu phải là JSON.',415);
  const reader=request.body?.getReader(); if(!reader) throw new AdminProductError('Thiếu dữ liệu.');
  const chunks:Uint8Array[]=[];let size=0;
  try { while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>131072){await reader.cancel();throw new AdminProductError('Dữ liệu quá lớn.',413);}chunks.push(value);} }
  finally {reader.releaseLock();}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;}catch{throw new AdminProductError('JSON không hợp lệ.');}
}
