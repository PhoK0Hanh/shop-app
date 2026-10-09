// Các thao tác CRUD được thử trên bảng TEMP riêng, không thay đổi catalog thật.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import ts from 'typescript';
import pg from 'pg';
const require=createRequire(import.meta.url);
function load(pool){const source=ts.transpileModule(fs.readFileSync('lib/admin-products.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const output={};new Function('require','exports',source)(name=>name==='server-only'?{}:name==='./db'?{pool}:require(name),output);return output;}
const draft={id:'',version:'',name:'Test Shirt',description:'Test description',originalPrice:100000,salePrice:80000,categoryId:'cat-test',images:['/images/test.jpg'],styleIds:['style-test'],isActive:true,variants:[{id:'',color:'Black',size:'M',stock:5,isActive:true,hasOrders:false}]};
test('admin input validates prices, image schemes, duplicate variants and stock',()=>{
  const {parseProductDraft}=load({});
  assert.equal(parseProductDraft(draft).name,'Test Shirt');
  for(const invalid of [{originalPrice:0},{salePrice:100000},{images:['javascript:alert(1)']},{images:[]},{variants:[...draft.variants,...draft.variants]},{variants:[{...draft.variants[0],stock:-1}]}])assert.throws(()=>parseProductDraft({...draft,...invalid}));
});
test('admin database CRUD, role guards, conflict protection and order history', {skip:!process.env.PGDATABASE},async()=>{
  const client=new pg.Client({connectionTimeoutMillis:5000});await client.connect();
  try{
    await client.query("CREATE TEMP TABLE users (id text PRIMARY KEY, role text, is_active boolean DEFAULT true); INSERT INTO users(id,role) VALUES ('admin','admin'),('customer','customer')");
    await client.query(fs.readFileSync('docs/catalog-schema.sql','utf8').replaceAll('CREATE TABLE ','CREATE TEMP TABLE '));
    await client.query(fs.readFileSync('docs/orders-schema.sql','utf8').replaceAll('public.','').replaceAll('CREATE TABLE ','CREATE TEMP TABLE '));
    await client.query("INSERT INTO categories VALUES ('cat-test','Test Category','test-category'); INSERT INTO styles VALUES ('style-test','Test Style','test-style')");
    const pool={query:client.query.bind(client),connect:async()=>({query:client.query.bind(client),release(){}})};
    const {saveAdminProduct,getAdminProducts,deleteAdminProduct,parseProductDraft}=load(pool);
    await assert.rejects(saveAdminProduct('customer',parseProductDraft(draft)),{status:403});
    assert.equal((await getAdminProducts()).length,0);
    const id=await saveAdminProduct('admin',parseProductDraft(draft));
    let product=(await getAdminProducts())[0];assert.equal(product.name,draft.name);assert.equal(product.variants[0].stock,5);assert.equal(product.hasOrders,false);
    await saveAdminProduct('admin',parseProductDraft({...product,name:'Updated',isActive:false}),id);
    await assert.rejects(saveAdminProduct('admin',parseProductDraft(product),id),{status:409});
    product=(await getAdminProducts())[0];assert.equal(product.isActive,false);assert.equal(product.styleIds[0],'style-test');
    const stableId=product.variants[0].id;
    await saveAdminProduct('admin',parseProductDraft({...product,variants:[{...product.variants[0],color:'White'}]}),id);
    product=(await getAdminProducts())[0];assert.equal(product.variants[0].color,'White');assert.equal(product.variants[0].id,stableId);
    await saveAdminProduct('admin',parseProductDraft({...product,variants:[{...product.variants[0],color:'Black'}]}),id);
    product=(await getAdminProducts())[0];
    const variantId=product.variants[0].id;
    await client.query("INSERT INTO orders(id,user_id,request_id,request_hash,total) VALUES ('order-test','customer',$1,'test',80000)",[randomUUID()]);
    await client.query("INSERT INTO order_items(id,order_id,variant_id,product_id,product_name,color,size,unit_price,quantity) VALUES ('item-test','order-test',$1,$2,'Snapshot Shirt','Black','M',80000,1)",[variantId,id]);
    product=(await getAdminProducts())[0];assert.equal(product.hasOrders,true);assert.equal(product.variants[0].hasOrders,true);
    await assert.rejects(deleteAdminProduct('admin',id),{status:409});
    await assert.rejects(saveAdminProduct('admin',parseProductDraft({...product,variants:[{...product.variants[0],color:'White'}]}),id));
    await saveAdminProduct('admin',parseProductDraft({...product,variants:[{id:'',color:'White',size:'L',stock:2,isActive:true,hasOrders:false}]}),id);
    const variants=(await getAdminProducts())[0].variants;
    assert.equal(variants.find(v=>v.id===variantId).isActive,false);
    assert.equal(variants.find(v=>v.id===variantId).stock,5);
    assert.equal((await client.query("SELECT product_name FROM order_items WHERE id='item-test'")).rows[0].product_name,'Snapshot Shirt');
    const second=await saveAdminProduct('admin',parseProductDraft(draft));
    await assert.rejects(deleteAdminProduct('customer',second),{status:403});
    await deleteAdminProduct('admin',second);
    assert.equal((await getAdminProducts()).length,1);
  }finally{await client.end();}
});
