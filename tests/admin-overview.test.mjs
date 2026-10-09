// Chỉ dùng bảng TEMP để kiểm tra thống kê, không thay đổi dữ liệu shop thật.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import pg from 'pg';
function load(pool) {
  const source=ts.transpileModule(fs.readFileSync('lib/admin-overview.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const output={};new Function('require','exports',source)(name=>name==='server-only'?{}:{pool},output);return output;
}
test('invalid periods default to 30 days',()=>{
  const {parseOverviewRange}=load({});
  assert.equal(parseOverviewRange(null),'30d');assert.equal(parseOverviewRange('invalid'),'30d');
  assert.equal(parseOverviewRange('7d'),'7d');assert.equal(parseOverviewRange('month'),'month');
});
test('overview uses UTC+7 order dates and live stock/account totals',{skip:!process.env.PGDATABASE},async()=>{
  const client=new pg.Client({connectionTimeoutMillis:5000});await client.connect();
  try {
    await client.query(`CREATE TEMP TABLE users(id text,name text,role text,is_active boolean);
      CREATE TEMP TABLE products(id text,name text,is_active boolean);
      CREATE TEMP TABLE product_variants(id text,product_id text,color text,size text,stock integer,is_active boolean);
      CREATE TEMP TABLE orders(id text,user_id text,shipping_name text,status text,total bigint,created_at timestamptz);
      INSERT INTO users VALUES ('u','Customer','customer',true),('locked','Locked','customer',false),('a','Admin','admin',true);
      INSERT INTO products VALUES ('p','Product',true),('hidden','Hidden',false);
      INSERT INTO product_variants VALUES ('zero','p','black','S',0,true),('low','p','white','M',5,true),('ok','p','black','L',6,true),('inactive','p','gray','S',1,false),('hidden','hidden','gray','S',1,true);
      WITH today AS (SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date AS day)
      INSERT INTO orders SELECT id,'u',name,status,total,((day+offset_days)::timestamp+offset_time) AT TIME ZONE 'Asia/Bangkok'
      FROM today CROSS JOIN (VALUES
        ('prep',NULL::text,'preparing',100,0,interval '0 hours'),
        ('ship','Recipient','shipping',200,-1,interval '23 hours 59 minutes'),
        ('done','Recipient','delivered',300,0,interval '1 hour'),
        ('cancel','Recipient','cancelled',400,0,interval '2 hours'),
        ('old','Recipient','delivered',900,-40,interval '0 hours'),
        ('future','Recipient','preparing',800,1,interval '0 hours')
      ) AS fixture(id,name,status,total,offset_days,offset_time);`);
    const {getAdminOverview}=load({connect:async()=>({query:client.query.bind(client),release(){}})});
    for(const range of ['7d','30d','month']) {
      const data=await getAdminOverview(range);
      assert.equal(data.range,range);
      const expected=range==='month'?Number(data.to.slice(-2)):range==='7d'?7:30;
      assert.equal(data.days.length,expected);assert.equal(data.days.at(0).date,data.from);assert.equal(data.days.at(-1).date,data.to);
      const yesterdayIncluded=data.from<data.to;
      assert.deepEqual(data.orders,{total:yesterdayIncluded?4:3,preparing:1,shipping:yesterdayIncluded?1:0,delivered:1,cancelled:1,deliveredValue:300});
      assert.equal(data.days.at(-1).count,3);assert.equal(data.days.reduce((sum,d)=>sum+d.count,0),data.orders.total);
      assert.deepEqual(data.products,{total:2,active:1,hidden:1});assert.deepEqual(data.customers,{total:2,locked:1});
      assert.equal(data.lowStockCount,2);assert.deepEqual(data.lowStock.map(v=>v.id),['zero','low']);
      assert.equal(data.recent[0].id,'cancel');assert.equal(data.recent.find(o=>o.id==='prep').recipient,'Customer');
      assert.equal(data.recent.some(o=>['old','future'].includes(o.id)),false);
    }
    await client.query('DELETE FROM orders');
    const empty=await getAdminOverview('7d');assert.equal(empty.orders.deliveredValue,0);assert.equal(empty.days.every(d=>d.count===0),true);assert.deepEqual(empty.recent,[]);
  } finally {await client.end();}
});
