// Chạy: node --env-file=.env.local scripts/seed-demo-orders.mjs
// Đơn mẫu dùng snapshot riêng, không liên kết hoặc thay đổi tồn kho sản phẩm thật.
import { randomUUID,randomBytes,scryptSync,createHash } from 'node:crypto';
import pg from 'pg';

const userId='demo-orders-customer-v1';
const client=new pg.Client({connectionTimeoutMillis:5000});
try {
  await client.connect();
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('shop-demo-orders-v1'))");
  // Mật khẩu ngẫu nhiên bị bỏ đi; hồ sơ mẫu bị khóa và không liên kết Firebase.
  const salt=randomBytes(16).toString('hex');
  const hash=`scrypt:${salt}:${scryptSync(randomBytes(32),salt,64).toString('hex')}`;
  await client.query(`INSERT INTO public.users(id,name,email,password_hash,role,is_active)
    VALUES($1,'Khách hàng mẫu','demo-orders@example.invalid',$2,'customer',false)
    ON CONFLICT(id) DO NOTHING`,[userId,hash]);
  const owner=await client.query("SELECT id FROM public.users WHERE id=$1 AND email='demo-orders@example.invalid' AND role='customer' AND NOT is_active AND firebase_uid IS NULL",[userId]);
  if(!owner.rowCount)throw new Error('ID hồ sơ mẫu đã được sử dụng bởi tài khoản khác.');
  const {rows:days}=await client.query(`SELECT day::date::text AS date FROM generate_series(
    (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date-29,
    (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date,interval '1 day') AS day ORDER BY day`);
  const counts=[4,8,6,3,9,5,2,0,7,4,5,8,3,6,7,4,6,2,9,7,3,9,5,6,4,8,7,2,3,5];
  const statuses=['preparing','shipping','delivered','delivered','cancelled'];
  let inserted=0;
  for(const [index,day] of days.entries()) {
    for(let number=1;number<=counts[index];number++) {
      const id=`demo-order-${day.date}-${String(number).padStart(2,'0')}`;
      const quantity=number%3+1;const price=199000+(index%4)*50000;
      const status=statuses[(index+number)%statuses.length];
      const requestHash=createHash('sha256').update(id).digest('hex');
      const result=await client.query(`INSERT INTO public.orders(id,user_id,request_id,request_hash,status,total,shipping_name,shipping_phone,shipping_address,shipping_note,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,'Khách hàng mẫu','0900000000','Địa chỉ minh họa - không giao hàng','DEMO_ORDERS_V1: dữ liệu giả để xem thống kê',
          $7::date::timestamp AT TIME ZONE 'Asia/Bangkok',$7::date::timestamp AT TIME ZONE 'Asia/Bangkok')
        ON CONFLICT(id) DO NOTHING RETURNING id`,[id,userId,randomUUID(),requestHash,status,price*quantity,day.date]);
      if(!result.rowCount)continue;
      await client.query(`INSERT INTO public.order_items(id,order_id,variant_id,product_id,product_name,color,size,unit_price,quantity)
        VALUES($1,$2,NULL,'demo-snapshot-product-v1','Áo mẫu thống kê (DEMO)','black','M',$3,$4)`,[`${id}-item`,id,price,quantity]);
      inserted++;
    }
  }
  await client.query('COMMIT');
  console.log(JSON.stringify({inserted,from:days[0].date,to:days.at(-1).date,marker:'DEMO_ORDERS_V1'}));
} catch(error) {
  await client.query('ROLLBACK').catch(()=>{});
  console.error(error.message);process.exitCode=1;
} finally {await client.end();}
