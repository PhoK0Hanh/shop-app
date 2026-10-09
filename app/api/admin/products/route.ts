import { NextRequest } from 'next/server';
import { adminResponse,readAdminBody } from '@/lib/admin-api';
import { getAdminProducts,parseProductDraft,saveAdminProduct } from '@/lib/admin-products';
import { getCategories,getStyles } from '@/lib/products';
export const runtime='nodejs';
// Catalog admin bao gồm cả sản phẩm đã ẩn và các lựa chọn chỉnh sửa.
export async function GET(request:NextRequest){return adminResponse(request,async()=>{const [products,categories,styles]=await Promise.all([getAdminProducts(),getCategories(),getStyles()]);return {products,categories,styles};});}
export async function POST(request:NextRequest){return adminResponse(request,async(userId)=>({id:await saveAdminProduct(userId,parseProductDraft(await readAdminBody(request)))}));}
