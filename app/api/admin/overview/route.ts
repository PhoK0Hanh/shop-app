import { NextRequest } from 'next/server';
import { adminResponse } from '@/lib/admin-api';
import { getAdminOverview,parseOverviewRange } from '@/lib/admin-overview';
export const runtime='nodejs';
// Thống kê riêng cho admin; không cache dữ liệu tài khoản/đơn giữa các phiên.
export async function GET(request:NextRequest){return adminResponse(request,async()=>getAdminOverview(parseOverviewRange(request.nextUrl.searchParams.get('range'))));}
