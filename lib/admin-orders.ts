import 'server-only';
import { pool } from './db';
import { cancelOrderAsAdmin,OrderError } from './orders';
import type { AdminOrder } from './admin-order-types';
import type { OrderItem,OrderStatus } from './order-types';

export async function getAdminOrders():Promise<AdminOrder[]>{
  const db=await pool.connect();
  try{
    // Danh sách và chi tiết đọc cùng snapshot; không dùng giá catalog hiện tại.
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const orders=await db.query(`SELECT o.*,u.name AS customer_name,u.email AS customer_email
      FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC,o.id`);
    const items=await db.query<OrderItem & {orderId:string}>(`SELECT id,order_id AS "orderId",product_id AS "productId",product_name AS "productName",color,size,unit_price AS "unitPrice",quantity FROM order_items ORDER BY order_id,id`);
    await db.query('COMMIT');
    return orders.rows.map(row=>({id:row.id,status:row.status,total:Number(row.total),createdAt:row.created_at.toISOString(),
      customerName:row.customer_name,customerEmail:row.customer_email,
      shipping:row.shipping_name===null?null:{recipientName:row.shipping_name,phone:row.shipping_phone,address:row.shipping_address,note:row.shipping_note??''},
      items:items.rows.filter(item=>item.orderId===row.id)}));
  }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}

export function parseAdminOrderStatus(body:unknown):OrderStatus{
  if(!body||typeof body!=='object'||!('status' in body)||typeof body.status!=='string'||!['shipping','delivered','cancelled'].includes(body.status))throw new OrderError('Trạng thái không hợp lệ.');
  return body.status as OrderStatus;
}
export async function changeAdminOrderStatus(userId:string,orderId:string,status:OrderStatus){
  if(status==='cancelled')return cancelOrderAsAdmin(userId,orderId);
  if(status!=='shipping'&&status!=='delivered')throw new OrderError('Trạng thái không hợp lệ.');
  const db=await pool.connect();
  try{
    await db.query('BEGIN');
    // Khóa admin và đơn, phối hợp với hủy đơn để không giao một đơn vừa bị hủy.
    const user=await db.query("SELECT role FROM users WHERE id=$1 AND is_active=true FOR UPDATE",[userId]);
    if(user.rows[0]?.role!=='admin')throw new OrderError('Chỉ admin được quản lý đơn hàng.',403);
    const order=await db.query<{status:OrderStatus}>('SELECT status FROM orders WHERE id=$1 FOR UPDATE',[orderId]);
    if(!order.rows[0])throw new OrderError('Không tìm thấy đơn hàng.',404);
    const current=order.rows[0].status;
    if(current===status){await db.query('COMMIT');return;}
    if((status==='shipping'&&current!=='preparing')||(status==='delivered'&&current!=='shipping'))throw new OrderError('Trạng thái đơn đã thay đổi hoặc không cho phép thao tác này. Hãy tải lại danh sách.',409);
    await db.query('UPDATE orders SET status=$2,updated_at=CURRENT_TIMESTAMP WHERE id=$1',[orderId,status]);
    await db.query('COMMIT');
  }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}
