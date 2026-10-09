import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/firebase/session';
import { cancelOrder, OrderError } from '@/lib/orders';

export const runtime = 'nodejs';
function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Xác thực bằng session, giới hạn theo chủ đơn và kiểm tra Origin trước khi thay đổi dữ liệu.
  if (request.headers.get('origin') !== request.nextUrl.origin) return json({ error: 'Nguồn yêu cầu không hợp lệ.' }, 403);
  try {
    const user = await getSessionUser();
    if (!user) return json({ error: 'Vui lòng đăng nhập.' }, 401);
    const { id } = await params;
    if (!id || id.length > 200) return json({ error: 'ID đơn không hợp lệ.' }, 400);
    await cancelOrder(user.id, id);
    return json({ id, status: 'cancelled' });
  } catch (error) {
    return error instanceof OrderError ? json({ error: error.message }, error.status)
      : json({ error: 'Chưa thể hủy đơn hàng. Vui lòng thử lại.' }, 500);
  }
}
