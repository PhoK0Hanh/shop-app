import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/firebase/session';
import { createOrder, getOrders, OrderError, parseOrderRequest } from '@/lib/orders';

export const runtime = 'nodejs';
function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
function failure(error: unknown) {
  return error instanceof OrderError ? json({ error: error.message }, error.status)
    : json({ error: 'Không xử lý được đơn hàng. Vui lòng thử lại.' }, 500);
}
export async function GET() {
  try {
    const user = await getSessionUser();
    return user ? json({ orders: await getOrders(user.id) }) : json({ error: 'Vui lòng đăng nhập.' }, 401);
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  // Cookie xác thực và kiểm tra Origin bảo vệ thao tác tạo đơn.
  if (request.headers.get('origin') !== request.nextUrl.origin) return json({ error: 'Nguồn yêu cầu không hợp lệ.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'Yêu cầu phải là JSON.' }, 415);
  try {
    const user = await getSessionUser();
    if (!user) return json({ error: 'Vui lòng đăng nhập.' }, 401);
    // Đọc có giới hạn thực tế, không chỉ tin Content-Length từ client.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Thiếu dữ liệu giỏ hàng.' }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 32768) { await reader.cancel(); return json({ error: 'Giỏ hàng quá lớn.' }, 413); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    let body: unknown;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { return json({ error: 'JSON không hợp lệ.' }, 400); }
    const id = await createOrder(user.id, parseOrderRequest(body));
    return json({ id }, 201);
  } catch (error) { return failure(error); }
}
