import axios, { AxiosError } from 'axios';
import type { AxiosAdapter } from 'axios';
import { createDemoData, demoAdminId, demoStorageKey } from './admin-demo-data';
import type { DemoData } from './admin-demo-data';
import type { ProductDraft, AdminProduct } from './admin-product-types';
import type { AdminOverview, OverviewRange } from './admin-overview-types';

type DemoStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
class DemoError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function resetDemo(storage: DemoStorage) {
  const data = createDemoData();
  storage.setItem(demoStorageKey, JSON.stringify(data));
  return data;
}
export function clearDemo(storage: DemoStorage) { storage.removeItem(demoStorageKey); }
export function readDemo(storage: DemoStorage): DemoData {
  const raw = storage.getItem(demoStorageKey);
  if (!raw) return resetDemo(storage);
  try {
    const data = JSON.parse(raw) as DemoData;
    if (data.schema === 1 && ['products', 'orders', 'users', 'categories', 'styles'].every(key => Array.isArray(data[key as keyof DemoData]))) return data;
  } catch { /* Phiên cũ hoặc JSON hỏng được khởi tạo lại từ dữ liệu giả. */ }
  return resetDemo(storage);
}

const dayKey = (date: Date) => new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 10);
export function demoOverview(data: DemoData, range: OverviewRange, now = new Date()): AdminOverview {
  const to = dayKey(now);
  const end = new Date(`${to}T00:00:00Z`);
  const start = new Date(end);
  if (range === 'month') start.setUTCDate(1);
  else start.setUTCDate(start.getUTCDate() - (range === '7d' ? 6 : 29));
  const from = start.toISOString().slice(0, 10);
  const selected = data.orders.filter(o => { const date = dayKey(new Date(o.createdAt)); return date >= from && date <= to; });
  const counts = { preparing: 0, shipping: 0, delivered: 0, cancelled: 0, total: selected.length, deliveredValue: 0 };
  for (const order of selected) { counts[order.status]++; if (order.status === 'delivered') counts.deliveredValue += order.total; }
  const days: AdminOverview['days'] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10);
    days.push({ date, count: selected.filter(o => dayKey(new Date(o.createdAt)) === date).length });
  }
  const lowStock = data.products.filter(p => p.isActive).flatMap(p => p.variants.filter(v => v.isActive && v.stock <= 5).map(v => ({ id: v.id, productId: p.id, name: p.name, color: v.color, size: v.size, stock: v.stock }))).sort((a, b) => a.stock - b.stock);
  const active = data.products.filter(p => p.isActive).length;
  return { range, from, to, days, orders: counts,
    products: { total: data.products.length, active, hidden: data.products.length - active },
    customers: { total: data.users.filter(u => u.role === 'customer').length, locked: data.users.filter(u => u.role === 'customer' && !u.isActive).length },
    lowStockCount: lowStock.length, lowStock: lowStock.slice(0, 10),
    recent: selected.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10).map(o => ({ id: o.id, recipient: o.shipping?.recipientName ?? o.customerName, status: o.status, total: o.total, createdAt: o.createdAt })),
  };
}

function saveProduct(data: DemoData, draft: ProductDraft, id?: string) {
  const previous = id ? data.products.find(p => p.id === id) : undefined;
  if (id && !previous) throw new DemoError('Không tìm thấy sản phẩm.', 404);
  if (previous && previous.version !== draft.version) throw new DemoError('Dữ liệu đã thay đổi. Hãy tải lại trước khi sửa.', 409);
  if (typeof draft.name !== 'string' || !draft.name.trim() || draft.name.length > 200 || typeof draft.description !== 'string' || draft.description.length > 10000) throw new DemoError('Kiểm tra tên và mô tả sản phẩm.');
  if (!data.categories.some(c => c.id === draft.categoryId) || !Array.isArray(draft.styleIds) || new Set(draft.styleIds).size !== draft.styleIds.length || draft.styleIds.some(id => !data.styles.some(s => s.id === id))) throw new DemoError('Danh mục hoặc phong cách không hợp lệ.');
  if (!Number.isInteger(draft.originalPrice) || draft.originalPrice < 1 || draft.originalPrice > 2147483647 || (draft.salePrice !== undefined && (!Number.isInteger(draft.salePrice) || draft.salePrice < 0 || draft.salePrice >= draft.originalPrice))) throw new DemoError('Giá gốc phải lớn hơn 0; giá giảm phải nhỏ hơn giá gốc.');
  if (!Array.isArray(draft.images) || !draft.images.length || draft.images.length > 30 || draft.images.some(url => {
    if (typeof url !== 'string' || url.length > 2000) return true;
    if (/^\/[^/]/.test(url) && !url.includes('\\')) return false;
    try { return !['http:', 'https:'].includes(new URL(url).protocol); } catch { return true; }
  })) throw new DemoError('Cần 1–30 đường dẫn ảnh hợp lệ (http/https hoặc /images/...).');
  if (typeof draft.isActive !== 'boolean' || !Array.isArray(draft.variants) || !draft.variants.length || draft.variants.length > 40) throw new DemoError('Cần từ 1 đến 40 biến thể hợp lệ.');
  const combinations = new Set<string>();
  const ids = new Set<string>();
  for (const variant of draft.variants) {
    if (!['Black', 'White', 'Gray', 'Navy', 'Blue', 'Beige', 'Green', 'Burgundy'].includes(variant.color) || !['S', 'M', 'L', 'XL', 'XXL'].includes(variant.size) || !Number.isInteger(variant.stock) || variant.stock < 0 || variant.stock > 2147483647 || typeof variant.isActive !== 'boolean') throw new DemoError('Màu, kích cỡ hoặc tồn kho không hợp lệ.');
    const combo = `${variant.color}:${variant.size}`;
    if (combinations.has(combo) || (variant.id && ids.has(variant.id))) throw new DemoError('Không được trùng biến thể màu + kích cỡ.');
    combinations.add(combo); ids.add(variant.id);
    const old = previous?.variants.find(v => v.id === variant.id);
    if (variant.id && !old) throw new DemoError('Biến thể không thuộc sản phẩm.');
    if (old?.hasOrders && (old.color !== variant.color || old.size !== variant.size)) throw new DemoError('Biến thể đã có đơn không được đổi màu/kích cỡ.');
  }
  if (draft.isActive && !draft.variants.some(v => v.isActive)) throw new DemoError('Sản phẩm đang bán cần biến thể hoạt động.');
  if (previous?.variants.some(old => old.hasOrders && !draft.variants.some(v => v.id === old.id))) throw new DemoError('Biến thể đã có đơn chỉ được ngừng sử dụng.');
  const product: AdminProduct = { ...draft, id: previous?.id ?? `demo-product-${crypto.randomUUID()}`, name: draft.name.trim(), description: draft.description.trim(),
    createdAt: previous?.createdAt ?? new Date().toISOString(), soldCount: previous?.soldCount ?? 0, hasOrders: previous?.hasOrders ?? false, version: crypto.randomUUID(),
    variants: draft.variants.map(v => ({ ...v, id: v.id || `demo-variant-${crypto.randomUUID()}`, hasOrders: previous?.variants.find(old => old.id === v.id)?.hasOrders ?? false })) };
  if (previous) data.products[data.products.indexOf(previous)] = product;
  else data.products.unshift(product);
  return { id: product.id };
}

// Adapter này chỉ thao tác trên sessionStorage. Endpoint không hỗ trợ luôn báo lỗi, không fallback HTTP.
export function createDemoClient(storage: DemoStorage) {
  let active = true;
  const adapter: AxiosAdapter = async config => {
    const response = { data: {} as unknown, status: 200, statusText: 'OK', headers: {}, config };
    try {
      if (!active) throw new DemoError('Phiên demo đã kết thúc.', 401);
      const url = new URL(config.url ?? '', 'https://demo.invalid');
      if (url.origin !== 'https://demo.invalid') throw new DemoError('Demo không hỗ trợ yêu cầu bên ngoài.', 403);
      const path = url.pathname;
      const method = config.method?.toUpperCase() ?? 'GET';
      const data = readDemo(storage);
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      let result: unknown;
      if (method === 'GET' && path === '/admin/products') result = { products: data.products, categories: data.categories, styles: data.styles };
      else if (method === 'GET' && path === '/admin/orders') result = { orders: data.orders };
      else if (method === 'GET' && path === '/admin/users') result = { users: data.users, currentUserId: demoAdminId };
      else if (method === 'GET' && path === '/admin/overview') {
        const raw = url.searchParams.get('range');
        result = demoOverview(data, raw === '7d' || raw === 'month' ? raw : '30d');
      } else if (method === 'POST' && path === '/admin/products') result = saveProduct(data, body);
      else if (method === 'PUT' && /^\/admin\/products\/[^/]+$/.test(path)) result = saveProduct(data, body, decodeURIComponent(path.split('/').pop()!));
      else if (method === 'DELETE' && /^\/admin\/products\/[^/]+$/.test(path)) {
        const id = decodeURIComponent(path.split('/').pop()!);
        const product = data.products.find(p => p.id === id);
        if (!product) throw new DemoError('Không tìm thấy sản phẩm.', 404);
        if (product.hasOrders) throw new DemoError('Sản phẩm đã có đơn, hãy dùng Ẩn.', 409);
        data.products = data.products.filter(p => p.id !== id); result = { success: true };
      } else if (method === 'PATCH' && /^\/admin\/users\/[^/]+$/.test(path)) {
        const user = data.users.find(u => u.id === decodeURIComponent(path.split('/').pop()!));
        if (!user) throw new DemoError('Không tìm thấy tài khoản.', 404);
        if (user.id === demoAdminId) throw new DemoError('Không thể khóa tài khoản đang sử dụng.', 409);
        if (typeof body?.isActive !== 'boolean') throw new DemoError('Trạng thái tài khoản không hợp lệ.');
        user.isActive = body.isActive; result = { success: true };
      } else if (method === 'PATCH' && /^\/admin\/orders\/[^/]+$/.test(path)) {
        const order = data.orders.find(o => o.id === decodeURIComponent(path.split('/').pop()!));
        if (!order) throw new DemoError('Không tìm thấy đơn hàng.', 404);
        const target = body?.status;
        if (!((order.status === 'preparing' && (target === 'shipping' || target === 'cancelled')) || (order.status === 'shipping' && target === 'delivered'))) throw new DemoError('Không thể chuyển sang trạng thái này.', 409);
        if (target === 'cancelled') for (const item of order.items) {
          const product = data.products.find(p => p.id === item.productId);
          const variant = product?.variants.find(v => v.color === item.color && v.size === item.size);
          if (product && variant) { variant.stock += item.quantity; product.soldCount = Math.max(0, product.soldCount - item.quantity); product.version = crypto.randomUUID(); }
        }
        order.status = target; result = { success: true };
      } else throw new DemoError('Thao tác này không có trong bản demo.', 404);
      if (method !== 'GET') storage.setItem(demoStorageKey, JSON.stringify(data));
      return { ...response, data: result };
    } catch (error) {
      const status = error instanceof DemoError ? error.status : 400;
      const message = error instanceof DemoError ? error.message : 'Không lưu được dữ liệu demo. Kiểm tra bộ nhớ trình duyệt hoặc đặt lại dữ liệu.';
      throw new AxiosError(message, 'ERR_DEMO', config, undefined, { ...response, status, data: { error: message } });
    }
  };
  return { client: axios.create({ adapter }), dispose() { active = false; } };
}
