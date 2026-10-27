// Kiểm thử demo hoàn toàn trong bộ nhớ; không cần Firebase, database hoặc network.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(name => dependencies[name] ?? require(name), exports);
  return exports;
}
const seed = load('lib/admin-demo-data.ts');
const { createDemoClient, resetDemo, clearDemo, readDemo, demoOverview } = load('lib/admin-demo.ts', { './admin-demo-data': seed });
function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
const failure = status => error => error.isAxiosError && error.response.status === status;

test('demo CRUD persists across clients, isolates visitors, resets and clears on exit', async () => {
  const first = storage(), second = storage();
  const { client, dispose } = createDemoClient(first);
  const before = (await client.get('/admin/products')).data;
  const editable = before.products.find(p => !p.hasOrders);
  await client.put(`/admin/products/${editable.id}`, { ...editable, name: 'Changed only here', isActive: false });
  const restored = createDemoClient(first).client;
  assert.equal((await restored.get('/admin/products')).data.products.find(p => p.id === editable.id).name, 'Changed only here');
  assert.equal((await createDemoClient(second).client.get('/admin/products')).data.products.find(p => p.id === editable.id).name, editable.name);
  const draft = { ...editable, id: '', version: '', name: 'New demo product', variants: editable.variants.map(v => ({ ...v, id: '', hasOrders: false })) };
  const created = (await client.post('/admin/products', draft)).data.id;
  assert.ok(created.startsWith('demo-product-'));
  await client.delete(`/admin/products/${created}`);
  assert.equal((await client.get('/admin/products')).data.products.length, before.products.length);
  const historical = before.products.find(p => p.hasOrders);
  await assert.rejects(client.delete(`/admin/products/${historical.id}`), failure(409));
  await assert.rejects(client.put(`/admin/products/${editable.id}`, editable), failure(409));
  resetDemo(first);
  assert.equal(readDemo(first).products.find(p => p.id === editable.id).name, editable.name);
  clearDemo(first); dispose();
  assert.equal(first.getItem(seed.demoStorageKey), null);
  await assert.rejects(client.get('/admin/products'), failure(401));
  assert.equal(first.getItem(seed.demoStorageKey), null);
});

test('order changes update stock and overview; cancellation cannot restock twice', async () => {
  const memory = storage();
  const { client } = createDemoClient(memory);
  const order = (await client.get('/admin/orders')).data.orders.find(o => o.status === 'preparing');
  const item = order.items[0];
  const before = readDemo(memory);
  const stock = before.products.find(p => p.id === item.productId).variants.find(v => v.color === item.color && v.size === item.size).stock;
  const summary = (await client.get('/admin/overview?range=30d')).data;
  await client.patch(`/admin/orders/${order.id}`, { status: 'cancelled' });
  const after = readDemo(memory);
  assert.equal(after.products.find(p => p.id === item.productId).variants.find(v => v.color === item.color && v.size === item.size).stock, stock + item.quantity);
  const updated = (await client.get('/admin/overview?range=30d')).data;
  assert.equal(updated.orders.cancelled, summary.orders.cancelled + 1);
  assert.equal(updated.orders.preparing, summary.orders.preparing - 1);
  await assert.rejects(client.patch(`/admin/orders/${order.id}`, { status: 'cancelled' }), failure(409));
  assert.deepEqual(readDemo(memory), after);
  const delivery = after.orders.find(o => o.status === 'preparing');
  await assert.rejects(client.patch(`/admin/orders/${delivery.id}`, { status: 'delivered' }), failure(409));
  await client.patch(`/admin/orders/${delivery.id}`, { status: 'shipping' });
  await client.patch(`/admin/orders/${delivery.id}`, { status: 'delivered' });
  assert.equal((await client.get('/admin/overview?range=30d')).data.orders.deliveredValue, updated.orders.deliveredValue + delivery.total);
});

test('user locks and product stock changes feed overview; demo admin cannot lock itself', async () => {
  const memory = storage();
  const { client } = createDemoClient(memory);
  const users = (await client.get('/admin/users')).data;
  const customer = users.users.find(u => u.role === 'customer' && u.isActive);
  const before = (await client.get('/admin/overview')).data;
  await client.patch(`/admin/users/${customer.id}`, { isActive: false });
  assert.equal((await client.get('/admin/overview')).data.customers.locked, before.customers.locked + 1);
  await assert.rejects(client.patch(`/admin/users/${users.currentUserId}`, { isActive: false }), failure(409));
  const product = readDemo(memory).products.find(p => p.isActive && p.variants.every(v => v.stock > 5));
  await client.put(`/admin/products/${product.id}`, { ...product, variants: product.variants.map(v => ({ ...v, stock: 0 })) });
  assert.equal((await client.get('/admin/overview')).data.lowStockCount, before.lowStockCount + product.variants.length);
});

test('invalid input is atomic and unknown or external requests never use a network adapter', async () => {
  const memory = storage();
  const { client } = createDemoClient(memory);
  const product = (await client.get('/admin/products')).data.products[0];
  const original = memory.getItem(seed.demoStorageKey);
  for (const patch of [{ originalPrice: -1 }, { salePrice: product.originalPrice }, { images: ['javascript:alert(1)'] }, { variants: [] }, { categoryId: 'missing' }, { variants: [product.variants[0], product.variants[0]] }]) {
    await assert.rejects(client.put(`/admin/products/${product.id}`, { ...product, ...patch }), failure(400));
    assert.equal(memory.getItem(seed.demoStorageKey), original);
  }
  await assert.rejects(client.get('/api/auth/session'), failure(404));
  await assert.rejects(client.get('https://example.invalid/admin/products'), failure(403));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(client.delete(`/admin/products/${product.id}`, { signal: controller.signal }), error => error.code === 'ERR_CANCELED');
  assert.equal(memory.getItem(seed.demoStorageKey), original);
});

test('storage errors do not silently save; damaged sessions can be reset', async () => {
  const memory = storage();
  memory.setItem(seed.demoStorageKey, '{broken');
  assert.equal(readDemo(memory).schema, 1);
  const { client } = createDemoClient({ ...memory, setItem() { throw new Error('quota'); } });
  const product = readDemo(memory).products[0];
  await assert.rejects(client.put(`/admin/products/${product.id}`, { ...product, name: 'Not saved' }), failure(400));
  assert.equal(readDemo(memory).products[0].name, product.name);
  const blocked = createDemoClient({ ...memory, getItem() { throw new Error('blocked'); } });
  await assert.rejects(blocked.client.get('/admin/products'), failure(400));
});

test('overview uses UTC+7 date boundaries and never includes future orders', () => {
  const now = new Date('2026-10-31T18:00:00Z');
  const data = seed.createDemoData(now);
  const month = demoOverview(data, 'month', now);
  assert.equal(month.from, '2026-11-01');
  assert.equal(month.to, '2026-11-01');
  assert.equal(month.days.length, 1);
  assert.equal(month.orders.total, 1);
  assert.equal(demoOverview(data, '7d', now).days.length, 7);
  assert.equal(demoOverview(data, '30d', now).days.length, 30);
});
