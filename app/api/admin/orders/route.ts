import { NextRequest } from 'next/server';
import { adminResponse } from '@/lib/admin-api';
import { getAdminOrders } from '@/lib/admin-orders';
export const runtime='nodejs';
// Chỉ admin được đọc toàn bộ đơn; API khách hàng vẫn giới hạn theo chủ đơn.
export async function GET(request:NextRequest){return adminResponse(request,async()=>({orders:await getAdminOrders()}));}
