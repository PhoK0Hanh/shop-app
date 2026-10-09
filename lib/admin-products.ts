import 'server-only';
import { randomUUID } from 'node:crypto';
import { pool } from './db';
import type { AdminProduct, AdminVariant, ProductDraft } from './admin-product-types';
import type { PoolClient } from 'pg';

export class AdminProductError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function parseProductDraft(value: unknown): ProductDraft {
  if (!value || typeof value !== 'object') throw new AdminProductError('Dữ liệu sản phẩm không hợp lệ.');
  const input = value as ProductDraft;
  const text = (v: unknown, max: number) => typeof v === 'string' && v.length <= max;
  if (!text(input.name, 200) || !input.name.trim() || !text(input.description, 10000)
    || !text(input.categoryId, 200) || !input.categoryId || typeof input.isActive !== 'boolean'
    || !text(input.version, 200)) throw new AdminProductError('Kiểm tra tên, mô tả và danh mục sản phẩm.');
  if (!Number.isInteger(input.originalPrice) || input.originalPrice < 1 || input.originalPrice > 2147483647
    || (input.salePrice !== undefined && (!Number.isInteger(input.salePrice) || input.salePrice < 0 || input.salePrice >= input.originalPrice))) throw new AdminProductError('Giá gốc phải lớn hơn 0; giá giảm phải nhỏ hơn giá gốc.');
  if (!Array.isArray(input.images) || input.images.length < 1 || input.images.length > 30 || input.images.some((url) => {
    if (!text(url, 2000)) return true;
    if (/^\/[^/]/.test(url)) return false;
    try { return !['http:', 'https:'].includes(new URL(url).protocol); } catch { return true; }
  })) throw new AdminProductError('Cần 1–30 đường dẫn ảnh hợp lệ (http/https hoặc đường dẫn /images/...).');
  if (!Array.isArray(input.styleIds) || input.styleIds.length > 30 || input.styleIds.some((id) => !text(id, 200))
    || new Set(input.styleIds).size !== input.styleIds.length) throw new AdminProductError('Phong cách không hợp lệ.');
  if (!Array.isArray(input.variants) || input.variants.length < 1 || input.variants.length > 40) throw new AdminProductError('Cần từ 1 đến 40 biến thể.');
  const combinations = new Set<string>(); const ids = new Set<string>();
  for (const variant of input.variants) {
    if (!variant || !['Black','White','Gray','Navy','Blue','Beige','Green','Burgundy'].includes(variant.color)
      || !['S','M','L','XL','XXL'].includes(variant.size) || !text(variant.id, 200)
      || !Number.isInteger(variant.stock) || variant.stock < 0 || variant.stock > 2147483647
      || typeof variant.isActive !== 'boolean') throw new AdminProductError('Màu, kích cỡ hoặc tồn kho biến thể không hợp lệ.');
    const combination = `${variant.color}:${variant.size}`;
    if (combinations.has(combination) || (variant.id && ids.has(variant.id))) throw new AdminProductError('Không được trùng biến thể màu + kích cỡ.');
    combinations.add(combination); if (variant.id) ids.add(variant.id);
  }
  if (input.isActive && !input.variants.some((variant) => variant.isActive)) throw new AdminProductError('Sản phẩm đang bán cần ít nhất một biến thể hoạt động.');
  return { id: input.id, version: input.version, name: input.name.trim(), description: input.description.trim(),
    originalPrice: input.originalPrice, salePrice: input.salePrice, categoryId: input.categoryId,
    images: input.images, styleIds: input.styleIds, variants: input.variants, isActive: input.isActive };
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const db = await pool.connect();
  try {
    // Đọc cùng snapshot, bao gồm sản phẩm/biến thể đã ẩn để admin có thể bật lại.
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const rows = await db.query(`SELECT p.*, p.updated_at::text AS version,
      EXISTS(SELECT 1 FROM order_items oi WHERE oi.product_id=p.id) AS "hasOrders"
      FROM products p ORDER BY p.created_at DESC, p.id`);
    const images = await db.query('SELECT product_id, url FROM product_images ORDER BY product_id, position');
    const styles = await db.query('SELECT product_id, style_id FROM product_styles ORDER BY product_id, style_id');
    const variants = await db.query<AdminVariant & { product_id: string }>(`SELECT v.id,v.product_id,v.color,v.size,v.stock,v.is_active AS "isActive",
      EXISTS(SELECT 1 FROM order_items oi WHERE oi.variant_id=v.id) AS "hasOrders" FROM product_variants v ORDER BY product_id,color,size,id`);
    await db.query('COMMIT');
    return rows.rows.map((p) => ({ id:p.id,name:p.name,description:p.description,originalPrice:p.original_price,salePrice:p.sale_price ?? undefined,
      categoryId:p.category_id,isActive:p.is_active,hasOrders:p.hasOrders,version:p.version,soldCount:p.sold_count,createdAt:p.created_at.toISOString(),
      images:images.rows.filter((r)=>r.product_id===p.id).map((r)=>r.url), styleIds:styles.rows.filter((r)=>r.product_id===p.id).map((r)=>r.style_id),
      variants:variants.rows.filter((r)=>r.product_id===p.id).map((v)=>({id:v.id,color:v.color,size:v.size,stock:v.stock,isActive:v.isActive,hasOrders:v.hasOrders})) }));
  } catch (error) { await db.query('ROLLBACK'); throw error; } finally { db.release(); }
}

async function requireAdmin(db: PoolClient, userId: string) {
  // Kiểm tra lại role trong transaction; khóa cùng thứ tự user → product → variants như đặt hàng.
  const user = await db.query("SELECT role FROM users WHERE id=$1 AND is_active=true FOR UPDATE", [userId]);
  if (user.rows[0]?.role !== 'admin') throw new AdminProductError('Chỉ admin được quản lý sản phẩm.',403);
}
export async function saveAdminProduct(userId: string, input: ProductDraft, productId?: string) {
  const db = await pool.connect();
  const id = productId ?? randomUUID();
  try {
    await db.query('BEGIN'); await requireAdmin(db,userId);
    if (productId) {
      const row = await db.query('SELECT updated_at::text AS version FROM products WHERE id=$1 FOR UPDATE',[id]);
      if (!row.rows[0]) throw new AdminProductError('Không tìm thấy sản phẩm.',404);
      if (row.rows[0].version !== input.version) throw new AdminProductError('Sản phẩm hoặc tồn kho đã thay đổi. Hãy tải lại dữ liệu trước khi sửa.',409);
    }
    const category = await db.query('SELECT id FROM categories WHERE id=$1',[input.categoryId]);
    const styles = await db.query('SELECT id FROM styles WHERE id=ANY($1::text[])',[input.styleIds]);
    if (!category.rows.length || styles.rows.length !== input.styleIds.length) throw new AdminProductError('Danh mục hoặc phong cách không còn tồn tại.');
    const existing = await db.query(`SELECT v.*,EXISTS(SELECT 1 FROM order_items oi WHERE oi.variant_id=v.id) AS ordered
      FROM product_variants v WHERE product_id=$1 ORDER BY id FOR UPDATE`,[id]);
    for (const variant of input.variants) {
      const previous = existing.rows.find((v)=>v.id===variant.id);
      if (variant.id && !previous) throw new AdminProductError('Biến thể không thuộc sản phẩm này.');
      if (previous?.ordered && (previous.color !== variant.color || previous.size !== variant.size)) throw new AdminProductError('Biến thể đã có đơn không được đổi màu hoặc kích cỡ. Hãy thêm biến thể khác.');
      if(existing.rows.some((v)=>v.ordered&&v.id!==variant.id&&v.color===variant.color&&v.size===variant.size)) throw new AdminProductError('Màu + kích cỡ này đã có lịch sử đơn. Hãy dùng lại biến thể hiện có.');
    }
    if (productId) await db.query(`UPDATE products SET name=$2,description=$3,category_id=$4,original_price=$5,sale_price=$6,is_active=$7,updated_at=CURRENT_TIMESTAMP WHERE id=$1`,[id,input.name,input.description,input.categoryId,input.originalPrice,input.salePrice ?? null,input.isActive]);
    else await db.query(`INSERT INTO products (id,name,description,category_id,original_price,sale_price,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7)`,[id,input.name,input.description,input.categoryId,input.originalPrice,input.salePrice ?? null,input.isActive]);
    // Xóa bản nháp chỉ xóa hẳn variant chưa có đơn; variant có lịch sử chuyển sang ngừng sử dụng.
    for (const previous of existing.rows.filter((v)=>!input.variants.some((item)=>item.id===v.id))) {
      if (previous.ordered) await db.query('UPDATE product_variants SET is_active=false WHERE id=$1',[previous.id]);
      else await db.query('DELETE FROM product_variants WHERE id=$1',[previous.id]);
    }
    // Tạm bỏ variant đổi combo chưa có đơn để đổi/chuyển màu-size mà không va UNIQUE.
    for(const variant of input.variants){const previous=existing.rows.find((v)=>v.id===variant.id);if(previous&&(previous.color!==variant.color||previous.size!==variant.size))await db.query('DELETE FROM product_variants WHERE id=$1',[variant.id]);}
    for (const variant of input.variants) {
      const previous = existing.rows.find((v)=>v.id===variant.id);
      if (previous && previous.color===variant.color && previous.size===variant.size) await db.query('UPDATE product_variants SET stock=$2,is_active=$3 WHERE id=$1',[variant.id,variant.stock,variant.isActive]);
      else await db.query('INSERT INTO product_variants (id,product_id,color,size,stock,is_active) VALUES ($1,$2,$3,$4,$5,$6)',[variant.id||randomUUID(),id,variant.color,variant.size,variant.stock,variant.isActive]);
    }
    await db.query('DELETE FROM product_images WHERE product_id=$1',[id]);
    for (const [position,url] of input.images.entries()) await db.query('INSERT INTO product_images (id,product_id,url,position) VALUES ($1,$2,$3,$4)',[randomUUID(),id,url,position]);
    await db.query('DELETE FROM product_styles WHERE product_id=$1',[id]);
    for (const style of input.styleIds) await db.query('INSERT INTO product_styles (product_id,style_id) VALUES ($1,$2)',[id,style]);
    await db.query('COMMIT'); return id;
  } catch(error) { await db.query('ROLLBACK'); throw error; } finally { db.release(); }
}
export async function deleteAdminProduct(userId:string,id:string) {
  const db=await pool.connect();
  try {
    await db.query('BEGIN'); await requireAdmin(db,userId);
    const product=await db.query('SELECT id FROM products WHERE id=$1 FOR UPDATE',[id]);
    if(!product.rows.length) throw new AdminProductError('Không tìm thấy sản phẩm.',404);
    const history=await db.query('SELECT 1 FROM order_items WHERE product_id=$1 LIMIT 1',[id]);
    if(history.rows.length) throw new AdminProductError('Sản phẩm đã có đơn hàng. Hãy dùng Ẩn thay vì Xóa.',409);
    await db.query('DELETE FROM products WHERE id=$1',[id]); await db.query('COMMIT');
  } catch(error) { await db.query('ROLLBACK'); throw error; } finally { db.release(); }
}
