import 'server-only';
import { getColorLabel,getProductNameLabel } from './catalog-labels';
import { createHash, randomUUID } from 'node:crypto';
import { pool } from '@/lib/db';
import type { CartItem } from '@/lib/cart';
import type { Order, OrderItem, OrderStatus, ShippingInfo } from '@/lib/order-types';
import { parseShipping } from '@/lib/shipping';

export class OrderError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function parseOrderRequest(body: unknown): { requestId: string; items: CartItem[]; shipping: ShippingInfo } {
  if (!body || typeof body !== 'object') throw new OrderError('Yêu cầu không hợp lệ.');
  const { requestId, items, shipping } = body as { requestId?: unknown; items?: unknown; shipping?: unknown };
  if (typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)
    || !Array.isArray(items) || items.length < 1 || items.length > 100) throw new OrderError('Giỏ hàng không hợp lệ.');
  const seen = new Set<string>();
  const parsed = items.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new OrderError('Sản phẩm không hợp lệ.');
    const { variantId, quantity } = item as CartItem;
    if (typeof variantId !== 'string' || !variantId.trim() || variantId.length > 200 || seen.has(variantId)
      || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 999) throw new OrderError('Số lượng hoặc biến thể không hợp lệ.');
    seen.add(variantId);
    return { variantId, quantity };
  });
  let recipient: ShippingInfo;
  try { recipient = parseShipping(shipping); }
  catch (error) { throw new OrderError(error instanceof Error ? error.message : 'Thông tin giao hàng không hợp lệ.'); }
  return { requestId: requestId.toLowerCase(), items: parsed.sort((a, b) => a.variantId.localeCompare(b.variantId)), shipping: recipient };
}

export async function createOrder(userId: string, request: ReturnType<typeof parseOrderRequest>) {
  const db = await pool.connect();
  // Khóa retry phải gắn với cả sản phẩm lẫn người nhận, không chỉ giỏ hàng.
  const hash = createHash('sha256').update(JSON.stringify({ items: request.items, shipping: request.shipping })).digest('hex');
  try {
    await db.query('BEGIN');
    // Khóa tài khoản để hai request cùng khóa không tạo đơn hoặc trừ kho hai lần.
    const user = await db.query('SELECT id FROM users WHERE id = $1 AND is_active = true FOR UPDATE', [userId]);
    if (!user.rows.length) throw new OrderError('Vui lòng đăng nhập lại.', 401);
    const existing = await db.query<{ id: string; request_hash: string }>('SELECT id, request_hash FROM orders WHERE user_id = $1 AND request_id = $2', [userId, request.requestId]);
    if (existing.rows[0]) {
      if (existing.rows[0].request_hash !== hash) throw new OrderError('Yêu cầu đặt hàng đã thay đổi. Vui lòng tải lại trang.', 409);
      await db.query('COMMIT');
      return existing.rows[0].id;
    }
    const ids = request.items.map((item) => item.variantId);
    // Khóa sản phẩm trước, biến thể sau, theo ID để các đơn cạnh tranh có cùng thứ tự khóa.
    const products = await db.query<{ id: string; name: string; price: number }>(
      `SELECT p.id, p.name, COALESCE(p.sale_price, p.original_price) AS price FROM products p
       WHERE p.is_active = true AND p.id IN (SELECT product_id FROM product_variants WHERE id = ANY($1::text[]))
       ORDER BY p.id FOR UPDATE`, [ids]);
    const variants = await db.query<{ id: string; product_id: string; color: string; size: string; stock: number }>(
      'SELECT id, product_id, color, size, stock FROM product_variants WHERE id = ANY($1::text[]) AND is_active = true ORDER BY id FOR UPDATE', [ids]);
    const lines = request.items.map((item) => {
      const variant = variants.rows.find((row) => row.id === item.variantId);
      const product = products.rows.find((row) => row.id === variant?.product_id);
      if (!variant || !product) throw new OrderError('Có sản phẩm không còn được bán. Vui lòng kiểm tra lại giỏ hàng.', 409);
      if (variant.stock < item.quantity) throw new OrderError(`${getProductNameLabel(product.name)} (${getColorLabel(variant.color)}, ${variant.size}) không đủ tồn kho.`, 409);
      return { ...item, variant, product };
    });
    const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const id = randomUUID();
    await db.query(`INSERT INTO orders (id, user_id, request_id, request_hash, total, shipping_name, shipping_phone, shipping_address, shipping_note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [id, userId, request.requestId, hash, total,
      request.shipping.recipientName, request.shipping.phone, request.shipping.address, request.shipping.note]);
    for (const line of lines) {
      // Chỉ lấy giá server; lưu snapshot và trừ tồn kho trong cùng transaction.
      await db.query(`INSERT INTO order_items (id, order_id, variant_id, product_id, product_name, color, size, unit_price, quantity)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [randomUUID(), id, line.variant.id, line.product.id, line.product.name, line.variant.color, line.variant.size, line.product.price, line.quantity]);
      await db.query('UPDATE product_variants SET stock = stock - $2 WHERE id = $1', [line.variant.id, line.quantity]);
    }
    for (const product of products.rows) {
      const quantity = lines.filter((line) => line.product.id === product.id).reduce((sum, line) => sum + line.quantity, 0);
      await db.query('UPDATE products SET sold_count = sold_count + $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [product.id, quantity]);
    }
    await db.query('COMMIT');
    return id;
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally { db.release(); }
}

// Hai điểm vào riêng, không nhận quyền admin từ request body của khách hàng.
export async function cancelOrder(userId: string, orderId: string) {
  return cancelOrderTransaction(userId, orderId, false);
}
export async function cancelOrderAsAdmin(userId: string, orderId: string) {
  return cancelOrderTransaction(userId, orderId, true);
}
async function cancelOrderTransaction(userId: string, orderId: string, asAdmin: boolean) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    // Cùng thứ tự khóa với tạo đơn; khóa đơn để retry chỉ hoàn kho một lần.
    const user = await db.query<{id:string;role:string}>('SELECT id, role FROM users WHERE id = $1 AND is_active = true FOR UPDATE', [userId]);
    if (!user.rows.length) throw new OrderError('Vui lòng đăng nhập lại.', 401);
    if (asAdmin && user.rows[0].role !== 'admin') throw new OrderError('Chỉ admin được quản lý đơn hàng.', 403);
    const order = await db.query<{ status: OrderStatus }>(
      asAdmin ? 'SELECT status FROM orders WHERE id = $1 FOR UPDATE' : 'SELECT status FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE', asAdmin ? [orderId] : [orderId, userId]);
    if (!order.rows[0]) throw new OrderError('Không tìm thấy đơn hàng.', 404);
    if (order.rows[0].status === 'cancelled') { await db.query('COMMIT'); return; }
    if (order.rows[0].status !== 'preparing') throw new OrderError('Chỉ có thể hủy đơn đang chuẩn bị.', 409);
    const items = await db.query<{ product_id: string; variant_id: string | null; quantity: number }>(
      'SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
    const products = await db.query<{ id: string }>(
      'SELECT id FROM products WHERE id = ANY($1::text[]) ORDER BY id FOR UPDATE', [items.rows.map((item) => item.product_id)]);
    const variants = await db.query<{ id: string }>(
      'SELECT id FROM product_variants WHERE id = ANY($1::text[]) ORDER BY id FOR UPDATE', [items.rows.flatMap((item) => item.variant_id ? [item.variant_id] : [])]);
    for (const variant of variants.rows) {
      // Hoàn kho cả biến thể đang bị ẩn; biến thể đã xóa không được tạo lại tự động.
      const quantity = items.rows.filter((item) => item.variant_id === variant.id).reduce((sum, item) => sum + item.quantity, 0);
      await db.query('UPDATE product_variants SET stock = stock + $2 WHERE id = $1', [variant.id, quantity]);
    }
    for (const product of products.rows) {
      const quantity = items.rows.filter((item) => item.product_id === product.id).reduce((sum, item) => sum + item.quantity, 0);
      await db.query('UPDATE products SET sold_count = GREATEST(0, sold_count - $2), updated_at = CURRENT_TIMESTAMP WHERE id = $1', [product.id, quantity]);
    }
    await db.query("UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [orderId]);
    await db.query('COMMIT');
  } catch (error) { await db.query('ROLLBACK'); throw error; }
  finally { db.release(); }
}

export async function getOrders(userId: string): Promise<Order[]> {
  // Luôn giới hạn theo user đã xác thực; trình duyệt không được truyền user_id để đọc đơn khác.
  const result = await pool.query<{ id: string; status: OrderStatus; total: string; created_at: Date;
    shipping_name: string | null; shipping_phone: string | null; shipping_address: string | null; shipping_note: string | null }>(
    `SELECT id, status, total, created_at, shipping_name, shipping_phone, shipping_address, shipping_note
     FROM orders WHERE user_id = $1 ORDER BY created_at DESC, id`, [userId]);
  if (!result.rows.length) return [];
  const items = await pool.query<OrderItem & { orderId: string }>(
    `SELECT id, order_id AS "orderId", product_id AS "productId", product_name AS "productName",
     color, size, unit_price AS "unitPrice", quantity FROM order_items WHERE order_id = ANY($1::text[]) ORDER BY id`, [result.rows.map((row) => row.id)]);
  return result.rows.map((row) => ({ id: row.id, status: row.status, total: Number(row.total), createdAt: row.created_at.toISOString(),
    items: items.rows.filter((item) => item.orderId === row.id),
    // Đơn cũ giữ NULL, không tự điền thông tin người nhận từ hồ sơ hiện tại.
    shipping: row.shipping_name === null ? null : { recipientName: row.shipping_name, phone: row.shipping_phone!, address: row.shipping_address!, note: row.shipping_note ?? '' },
  }));
}
