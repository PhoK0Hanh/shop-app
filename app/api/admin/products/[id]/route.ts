import { NextRequest } from 'next/server';
import { adminResponse,readAdminBody } from '@/lib/admin-api';
import { deleteAdminProduct,parseProductDraft,saveAdminProduct } from '@/lib/admin-products';
export const runtime='nodejs';
// ID lấy từ URL; phiên bản dữ liệu trong body ngăn ghi đè tồn kho mới.
export async function PUT(request:NextRequest,{params}:{params:Promise<{id:string}>}){return adminResponse(request,async(userId)=>({id:await saveAdminProduct(userId,parseProductDraft(await readAdminBody(request)),(await params).id)}));}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){return adminResponse(request,async(userId)=>{await deleteAdminProduct(userId,(await params).id);return {success:true};});}
