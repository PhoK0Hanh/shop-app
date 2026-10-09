import { NextRequest } from 'next/server';
import { adminResponse } from '@/lib/admin-api';
import { getAdminUsers } from '@/lib/admin-users';
export const runtime='nodejs';
// Trả ID admin hiện tại để UI khóa thao tác tự khóa; API vẫn kiểm tra lại.
export async function GET(request:NextRequest){return adminResponse(request,async(adminId)=>({users:await getAdminUsers(),currentUserId:adminId}));}
