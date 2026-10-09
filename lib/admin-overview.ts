import 'server-only';
import { pool } from './db';
import type { AdminOverview,OverviewRange } from './admin-overview-types';
export function parseOverviewRange(value:string|null):OverviewRange{return value==='7d'||value==='month'?value:'30d';}
export async function getAdminOverview(range:OverviewRange):Promise<AdminOverview>{
  const db=await pool.connect();
  try{
    // Dùng ngày UTC+7 ở PostgreSQL, không phụ thuộc timezone của máy chạy Node.
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const bounds=await db.query<{from:string;to:string}>(`WITH today AS (SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date AS day)
      SELECT (CASE WHEN $1='month' THEN date_trunc('month',day)::date WHEN $1='7d' THEN day-6 ELSE day-29 END)::text AS "from",day::text AS "to" FROM today`,[range]);
    const {from,to}=bounds.rows[0];
    const where="created_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Bangkok') AND created_at < (($2::date+1)::timestamp AT TIME ZONE 'Asia/Bangkok')";
    const counts=await db.query(`SELECT COUNT(*)::integer AS total,
      COUNT(*) FILTER(WHERE status='preparing')::integer AS preparing,COUNT(*) FILTER(WHERE status='shipping')::integer AS shipping,
      COUNT(*) FILTER(WHERE status='delivered')::integer AS delivered,COUNT(*) FILTER(WHERE status='cancelled')::integer AS cancelled,
      COALESCE(SUM(total) FILTER(WHERE status='delivered'),0)::text AS value FROM orders WHERE ${where}`,[from,to]);
    const days=await db.query<{date:string;count:number}>(`WITH dates AS (SELECT generate_series($1::date::timestamp,$2::date::timestamp,interval '1 day')::date AS day),
      counts AS (SELECT (created_at AT TIME ZONE 'Asia/Bangkok')::date AS day,COUNT(*)::integer AS count FROM orders WHERE ${where} GROUP BY 1)
      SELECT dates.day::text AS date,COALESCE(counts.count,0)::integer AS count FROM dates LEFT JOIN counts USING(day) ORDER BY dates.day`,[from,to]);
    const products=await db.query<{total:number;active:number;hidden:number}>(`SELECT COUNT(*)::integer AS total,COUNT(*) FILTER(WHERE is_active)::integer AS active,COUNT(*) FILTER(WHERE NOT is_active)::integer AS hidden FROM products`);
    const customers=await db.query<{total:number;locked:number}>(`SELECT COUNT(*)::integer AS total,COUNT(*) FILTER(WHERE NOT is_active)::integer AS locked FROM users WHERE role='customer'`);
    const lowStockCount=await db.query<{count:number}>(`SELECT COUNT(*)::integer AS count FROM product_variants v JOIN products p ON p.id=v.product_id WHERE p.is_active AND v.is_active AND v.stock<=5`);
    const lowStock=await db.query<AdminOverview['lowStock'][number]>(`SELECT v.id,p.id AS "productId",p.name,v.color,v.size,v.stock FROM product_variants v JOIN products p ON p.id=v.product_id
      WHERE p.is_active AND v.is_active AND v.stock<=5 ORDER BY v.stock,p.name,v.id LIMIT 10`);
    const recent=await db.query(`SELECT o.id,COALESCE(o.shipping_name,u.name) AS recipient,o.status,o.total,o.created_at
      FROM orders o JOIN users u ON u.id=o.user_id WHERE ${where.replaceAll('created_at','o.created_at')} ORDER BY o.created_at DESC,o.id LIMIT 5`,[from,to]);
    await db.query('COMMIT');
    const order=counts.rows[0];
    return {range,from,to,orders:{total:order.total,preparing:order.preparing,shipping:order.shipping,delivered:order.delivered,cancelled:order.cancelled,deliveredValue:Number(order.value)},days:days.rows,
      products:products.rows[0],customers:customers.rows[0],lowStockCount:lowStockCount.rows[0].count,lowStock:lowStock.rows,
      recent:recent.rows.map(o=>({id:o.id,recipient:o.recipient,status:o.status,total:Number(o.total),createdAt:o.created_at.toISOString()}))};
  }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}
