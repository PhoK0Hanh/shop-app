import 'server-only';
import { pool } from './db';
import { AdminProductError } from './admin-products';
import type { AdminUser } from './admin-user-types';

export async function getAdminUsers():Promise<AdminUser[]>{
  // Chỉ chọn các cột công khai cho admin; không dùng SELECT * trên bảng tài khoản.
  const result=await pool.query<Omit<AdminUser,'createdAt'> & {createdAt:Date}>(`SELECT u.id,u.name,u.email,u.role,u.is_active AS "isActive",
    (u.firebase_uid IS NOT NULL) AS "firebaseLinked",u.created_at AS "createdAt",
    (SELECT COUNT(*)::integer FROM orders o WHERE o.user_id=u.id) AS "orderCount"
    FROM users u ORDER BY u.created_at DESC,u.id`);
  return result.rows.map(user=>({...user,createdAt:user.createdAt.toISOString()}));
}
export function parseAccountState(body:unknown):boolean{
  if(!body||typeof body!=='object'||!('isActive' in body)||typeof body.isActive!=='boolean')throw new AdminProductError('Trạng thái tài khoản không hợp lệ.');
  return body.isActive;
}
export async function setAdminUserState(adminId:string,userId:string,isActive:boolean){
  const db=await pool.connect();
  try{
    await db.query('BEGIN');
    // Khóa theo ID để hai admin thao tác chéo không tạo vòng chờ khóa.
    const users=await db.query<{id:string;role:string;is_active:boolean}>(
      'SELECT id,role,is_active FROM users WHERE id=ANY($1::text[]) ORDER BY id FOR UPDATE',[[adminId,userId]]);
    const actor=users.rows.find(user=>user.id===adminId);
    if(!actor?.is_active||actor.role!=='admin')throw new AdminProductError('Chỉ admin đang hoạt động được quản lý tài khoản.',403);
    const target=users.rows.find(user=>user.id===userId);
    if(!target)throw new AdminProductError('Không tìm thấy tài khoản.',404);
    if(adminId===userId&&!isActive)throw new AdminProductError('Không thể khóa tài khoản admin đang sử dụng.',409);
    // Chỉ thay trạng thái website; không thay email, UID, role hay thông tin Firebase.
    await db.query('UPDATE users SET is_active=$2,updated_at=CURRENT_TIMESTAMP WHERE id=$1',[userId,isActive]);
    await db.query('COMMIT');
  }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}
