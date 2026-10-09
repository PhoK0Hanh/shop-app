// Kiểm thử quản lý tài khoản trên bảng TEMP, không khóa người dùng thật.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import pg from 'pg';
const require=createRequire(import.meta.url);
class AdminProductError extends Error {constructor(message,status=400){super(message);this.status=status;}}
function load(file,mocks){const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const output={};new Function('require','exports',source)(name=>name in mocks?mocks[name]:require(name),output);return output;}
function moduleFor(pool){return load('lib/admin-users.ts',{'server-only':{},'./db':{pool},'./admin-products':{AdminProductError}});}
test('account status must be a boolean',()=>{const {parseAccountState}=moduleFor({});for(const value of [null,{}, {isActive:'false'},{isActive:0}])assert.throws(()=>parseAccountState(value));assert.equal(parseAccountState({isActive:false}),false);});
test('admin locks/unlocks accounts, cannot self-lock, and website sessions reject locked profiles',{skip:!process.env.PGDATABASE},async()=>{
  const client=new pg.Client({connectionTimeoutMillis:5000});await client.connect();
  try{
    await client.query(`CREATE TEMP TABLE users(id text PRIMARY KEY,name text,email text,role text,is_active boolean DEFAULT true,firebase_uid text,created_at timestamptz DEFAULT CURRENT_TIMESTAMP,updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,password_hash text);
      CREATE TEMP TABLE orders(id text PRIMARY KEY,user_id text);
      INSERT INTO users(id,name,email,role,firebase_uid,password_hash) VALUES ('admin','Admin','admin@example.com','admin','uid-admin','private-hash'),('customer','Test Customer','customer@example.com','customer','uid-customer','private-hash'),('admin2','Admin Two','admin2@example.com','admin','uid-admin2','private-hash');
      INSERT INTO orders VALUES ('o1','customer'),('o2','customer');`);
    const pool={query:client.query.bind(client),connect:async()=>({query:client.query.bind(client),release(){}})};
    const {getAdminUsers,setAdminUserState}=moduleFor(pool);
    const users=await getAdminUsers();assert.equal(users.length,3);assert.equal(users.find(u=>u.id==='customer').orderCount,2);
    assert.equal(users.some(u=>'password_hash' in u),false);assert.equal(users.some(u=>'firebase_uid' in u),false);
    await assert.rejects(setAdminUserState('customer','admin',false),{status:403});
    await assert.rejects(setAdminUserState('admin','admin',false),{status:409});
    await assert.rejects(setAdminUserState('admin','missing',false),{status:404});
    await setAdminUserState('admin','customer',false);
    await setAdminUserState('admin','customer',false);
    assert.equal((await getAdminUsers()).find(u=>u.id==='customer').isActive,false);
    // Adapter chỉ đổi public.users thành bảng TEMP cho bài kiểm tra session/profile.
    const profiles=load('lib/users.ts',{'server-only':{},'@/lib/db':{pool:{query:(sql,args)=>client.query(sql.replaceAll('public.users','users'),args)}}});
    assert.equal(await profiles.getUserByFirebaseUid('uid-customer'),null);
    await setAdminUserState('admin','customer',true);
    assert.equal((await profiles.getUserByFirebaseUid('uid-customer')).role,'customer');
    assert.equal((await client.query("SELECT password_hash FROM users WHERE id='customer'")).rows[0].password_hash,'private-hash');
    assert.equal((await client.query('SELECT COUNT(*)::int AS count FROM orders')).rows[0].count,2);
    await setAdminUserState('admin','admin2',false);
    await assert.rejects(setAdminUserState('admin2','customer',false),{status:403});
    assert.equal((await profiles.getUserByFirebaseUid('uid-admin2')),null);
    await setAdminUserState('admin','admin2',true);
    assert.equal((await getAdminUsers()).find(u=>u.id==='admin').isActive,true);
  }finally{await client.end();}
});
test('admin API checks session, role and origin before allowing actions',async()=>{
  const {NextRequest}=require('next/server');let user=null;let calls=0;
  const {adminResponse}=load('lib/admin-api.ts',{'server-only':{},'./firebase/session':{getSessionUser:async()=>user},'./admin-products':{AdminProductError},'./orders':{OrderError:class extends Error {}}});
  const request=(method='GET',origin='http://localhost:3000')=>new NextRequest('http://localhost:3000/api/admin/users',{method,headers:{origin}});
  const action=async()=>{calls++;return {success:true};};
  assert.equal((await adminResponse(request(),action)).status,401);
  user={id:'customer',role:'customer'};assert.equal((await adminResponse(request(),action)).status,403);
  user={id:'admin',role:'admin'};assert.equal((await adminResponse(request('PATCH','https://other.example'),action)).status,403);
  assert.equal(calls,0);assert.equal((await adminResponse(request('PATCH'),action)).status,200);assert.equal(calls,1);
});
