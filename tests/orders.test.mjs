import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import ts from 'typescript';

const require = createRequire(import.meta.url);
// Fixture người nhận; không dùng thông tin cá nhân thật.
const shipping = { recipientName: 'Test User', phone: '0912345678', address: '123 Test Street, Test City', note: '' };
function loadOrders(pool) {
  // Dùng module nhãn thật để thông báo tồn kho vẫn được kiểm thử sau khi Việt hóa.
  const labels={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/catalog-labels.ts','utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText,{exports:labels});
  const shippingModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/shipping.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports: shippingModule.exports });
  const source = ts.transpileModule(fs.readFileSync('lib/orders.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(source, { exports: compiledModule.exports, module: compiledModule,
    require: (name) => name === 'server-only' ? {} : name === '@/lib/db' ? { pool } : name === '@/lib/shipping' ? shippingModule.exports : name === './catalog-labels' ? labels : require(name),
  });
  return compiledModule.exports;
}

// Dùng cùng connection TEMP với dịch vụ đơn của khách để thử thao tác admin.
function loadAdminOrders(pool){
  const code=ts.transpileModule(fs.readFileSync('lib/admin-orders.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};const orders=loadOrders(pool);
  new Function('require','exports',code)(name=>name==='server-only'?{}:name==='./db'?{pool}:name==='./orders'?orders:require(name),exports);
  return exports;
}
test('admin status parser rejects unsupported states and non-string values',()=>{
  const {parseAdminOrderStatus}=loadAdminOrders({});
  for(const body of [null,{}, {status:'preparing'},{status:['shipping']},{status:'paid'}])assert.throws(()=>parseAdminOrderStatus(body));
  assert.equal(parseAdminOrderStatus({status:'shipping'}),'shipping');
});

test('order request rejects duplicate variants, invalid quantities and client prices are ignored', () => {
  const { parseOrderRequest } = loadOrders({});
  const requestId = randomUUID();
  for (const items of [[], [{ variantId: 'v1', quantity: 0 }], [{ variantId: 'v1', quantity: 1.5 }], [{ variantId: 'v1', quantity: 1 }, { variantId: 'v1', quantity: 2 }]]) {
    assert.throws(() => parseOrderRequest({ requestId, items, shipping }));
  }
  const request = parseOrderRequest({ requestId, shipping, items: [{ variantId: 'v1', quantity: 2, price: 1 }] });
  assert.equal(JSON.stringify(request.items), JSON.stringify([{ variantId: 'v1', quantity: 2 }]));
});

test('shipping is required, normalized and bounded before accessing PostgreSQL', () => {
  const { parseOrderRequest } = loadOrders({});
  const base = { requestId: randomUUID(), items: [{ variantId: 'v1', quantity: 1 }] };
  for (const value of [undefined, {}, { ...shipping, recipientName: ' ' }, { ...shipping, phone: 'abc' },
    { ...shipping, address: 'short' }, { ...shipping, note: 'x'.repeat(1001) }, { ...shipping, note: 42 }]) {
    assert.throws(() => parseOrderRequest({ ...base, shipping: value }));
  }
  const normalized = parseOrderRequest({ ...base, shipping: { ...shipping, recipientName: ' Test User ', phone: '+84 912 345 678', note: ' Doorbell ' } }).shipping;
  assert.equal(normalized.recipientName, 'Test User');
  assert.equal(normalized.phone, '0912345678');
  assert.equal(normalized.note, 'Doorbell');
});

test('shipping migration preserves old orders and rejects incomplete addresses', { skip: !process.env.PGDATABASE }, async () => {
  const client = new pg.Client({ connectionTimeoutMillis: 5000 });
  await client.connect();
  try {
    // Bảng tạm mô phỏng schema cũ; migration không chạm orders thật.
    await client.query("CREATE TEMP TABLE orders (id text PRIMARY KEY, status text DEFAULT 'preparing' CONSTRAINT orders_status_check CHECK (status IN ('preparing','shipping','delivered'))); INSERT INTO orders (id) VALUES ('old-order')");
    await client.query(fs.readFileSync('docs/orders-shipping-migration.sql', 'utf8').replaceAll('public.', ''));
    await client.query(fs.readFileSync('docs/orders-cancellation-migration.sql', 'utf8').replaceAll('public.', ''));
    const old = (await client.query('SELECT * FROM orders')).rows[0];
    assert.equal(old.id, 'old-order');
    assert.equal(old.shipping_name, null);
    assert.equal(old.status, 'preparing');
    await client.query("UPDATE orders SET status='cancelled' WHERE id='old-order'");
    await assert.rejects(client.query("INSERT INTO orders (id, shipping_name) VALUES ('bad', 'Test User')"), { code: '23514' });
    await client.query("INSERT INTO orders (id,shipping_name,shipping_phone,shipping_address,shipping_note) VALUES ('new','Test User','0912345678','123 Test Street','')");
  } finally { await client.end(); }
});

test('PostgreSQL: snapshot, stock, idempotency, rollback and ownership', { skip: !process.env.PGDATABASE }, async () => {
  const client = new pg.Client({ connectionTimeoutMillis: 5000 });
  await client.connect();
  try {
    // Mọi bảng đều TEMP trên một connection riêng; không sửa các bảng public.
    await client.query(`CREATE TEMP TABLE users (id text PRIMARY KEY, is_active boolean DEFAULT true, role text DEFAULT 'customer', name text DEFAULT 'Test User', email text DEFAULT 'test@example.com');
      CREATE TEMP TABLE products (id text PRIMARY KEY, name text, original_price integer, sale_price integer, is_active boolean DEFAULT true, sold_count integer DEFAULT 0, updated_at timestamptz);
      CREATE TEMP TABLE product_variants (id text PRIMARY KEY, product_id text REFERENCES products(id), color text, size text, stock integer CHECK (stock >= 0), is_active boolean DEFAULT true);`);
    const schema = fs.readFileSync('docs/orders-schema.sql', 'utf8').replaceAll('public.', '').replaceAll('CREATE TABLE ', 'CREATE TEMP TABLE ');
    await client.query(schema);
    await client.query(`INSERT INTO users (id) VALUES ('u1'), ('u2');
      INSERT INTO products (id,name,original_price,sale_price) VALUES ('p1','Shirt',100000,80000);
      INSERT INTO product_variants (id,product_id,color,size,stock) VALUES ('v1','p1','Black','M',5), ('v2','p1','White','L',1);`);
    const pool = { query: client.query.bind(client), connect: async () => ({ query: client.query.bind(client), release() {} }) };
    const { createOrder, cancelOrder, getOrders, parseOrderRequest } = loadOrders(pool);
    const request = parseOrderRequest({ requestId: randomUUID(), shipping, items: [{ variantId: 'v1', quantity: 2 }] });
    const id = await createOrder('u1', request);
    assert.equal(await createOrder('u1', request), id);
    assert.equal((await client.query("SELECT stock FROM product_variants WHERE id='v1'")).rows[0].stock, 3);
    assert.equal((await client.query("SELECT sold_count FROM products WHERE id='p1'")).rows[0].sold_count, 2);
    const orders = await getOrders('u1');
    assert.equal(orders.length, 1);
    assert.equal(orders[0].status, 'preparing');
    assert.equal(orders[0].total, 160000);
    assert.equal(JSON.stringify(orders[0].shipping), JSON.stringify(shipping));
    assert.equal((await getOrders('u2')).length, 0);
    await client.query("UPDATE products SET name='Changed', sale_price=60000 WHERE id='p1'");
    assert.equal((await getOrders('u1'))[0].items[0].productName, 'Shirt');
    assert.equal((await getOrders('u1'))[0].items[0].unitPrice, 80000);
    await assert.rejects(createOrder('u1', parseOrderRequest({ requestId: request.requestId, shipping, items: [{ variantId: 'v1', quantity: 1 }] })), { status: 409 });
    await assert.rejects(createOrder('u1', parseOrderRequest({ ...request, shipping: { ...shipping, address: '456 Other Street, Test City' } })), { status: 409 });
    await assert.rejects(createOrder('u1', parseOrderRequest({ requestId: randomUUID(), shipping, items: [{ variantId: 'v1', quantity: 1 }, { variantId: 'v2', quantity: 2 }] })), { status: 409 });
    assert.equal((await getOrders('u1')).length, 1);
    assert.equal((await client.query("SELECT stock FROM product_variants WHERE id='v1'")).rows[0].stock, 3);
    // Chủ khác không được hủy; đơn giao/đã giao không được hoàn kho.
    await assert.rejects(cancelOrder('u2', id), { status: 404 });
    await assert.rejects(cancelOrder('u1', 'missing'), { status: 404 });
    for (const status of ['shipping', 'delivered']) {
      await client.query('UPDATE orders SET status=$2 WHERE id=$1', [id, status]);
      await assert.rejects(cancelOrder('u1', id), { status: 409 });
    }
    await client.query("UPDATE orders SET status='preparing' WHERE id=$1", [id]);
    // Giả lập lỗi cuối transaction: phần hoàn kho trước đó phải rollback.
    await client.query("ALTER TABLE orders ADD CONSTRAINT test_no_cancel CHECK (status <> 'cancelled')");
    await assert.rejects(cancelOrder('u1', id), { code: '23514' });
    assert.equal((await client.query("SELECT stock FROM product_variants WHERE id='v1'")).rows[0].stock, 3);
    assert.equal((await getOrders('u1'))[0].status, 'preparing');
    await client.query('ALTER TABLE orders DROP CONSTRAINT test_no_cancel');
    await cancelOrder('u1', id);
    await cancelOrder('u1', id);
    assert.equal((await getOrders('u1'))[0].status, 'cancelled');
    assert.equal((await client.query("SELECT stock FROM product_variants WHERE id='v1'")).rows[0].stock, 5);
    assert.equal((await client.query("SELECT sold_count FROM products WHERE id='p1'")).rows[0].sold_count, 0);
    assert.equal(await createOrder('u1', request), id);
    assert.equal((await getOrders('u1')).length, 1);
    const {changeAdminOrderStatus,getAdminOrders}=loadAdminOrders(pool);
    await client.query("INSERT INTO users(id,role) VALUES ('admin','admin')");
    const second=await createOrder('u1',parseOrderRequest({...request,requestId:randomUUID()}));
    await assert.rejects(changeAdminOrderStatus('u2',second,'shipping'),{status:403});
    await assert.rejects(changeAdminOrderStatus('u2',second,'cancelled'),{status:403});
    await assert.rejects(changeAdminOrderStatus('admin',second,'delivered'),{status:409});
    await changeAdminOrderStatus('admin',second,'shipping');
    await changeAdminOrderStatus('admin',second,'shipping');
    await assert.rejects(changeAdminOrderStatus('admin',second,'cancelled'),{status:409});
    await changeAdminOrderStatus('admin',second,'delivered');
    await changeAdminOrderStatus('admin',second,'delivered');
    await assert.rejects(changeAdminOrderStatus('admin',second,'shipping'),{status:409});
    await assert.rejects(changeAdminOrderStatus('admin',id,'shipping'),{status:409});
    await assert.rejects(changeAdminOrderStatus('admin','missing','shipping'),{status:404});
    const third=await createOrder('u1',parseOrderRequest({...request,requestId:randomUUID(),items:[{variantId:'v1',quantity:1}]}));
    await changeAdminOrderStatus('admin',third,'cancelled');
    await changeAdminOrderStatus('admin',third,'cancelled');
    assert.equal((await client.query("SELECT stock FROM product_variants WHERE id='v1'")).rows[0].stock,3);
    assert.equal((await client.query("SELECT sold_count FROM products WHERE id='p1'")).rows[0].sold_count,2);
    const all=await getAdminOrders();assert.equal(all.length,3);assert.equal(all.find(o=>o.id===second).status,'delivered');
    assert.equal(all.find(o=>o.id===third).shipping.phone,shipping.phone);
    assert.equal(all[0].customerEmail,'test@example.com');
    await client.query("UPDATE users SET is_active=false WHERE id='admin'");
    await assert.rejects(changeAdminOrderStatus('admin',second,'shipping'),{status:403});
    await client.query("UPDATE users SET is_active=false WHERE id='u1'");
    await assert.rejects(createOrder('u1', request), { status: 401 });
    await assert.rejects(cancelOrder('u1', id), { status: 401 });
  } finally { await client.end(); }
});
