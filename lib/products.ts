import "server-only";

import { pool } from "@/lib/db";
import type { Category, Product, ProductVariant, Style } from "@/lib/mock-data";
import type { ProductFilters } from "@/lib/product-filters";
import { shopPageSize } from "@/lib/shop-query";
import type { ShopPageData, ShopSortOrder } from "@/lib/shop-query";

interface ProductRow {
  id: string;
  name: string;
  original_price: number;
  sale_price: number | null;
  description: string;
  category_id: string;
  sold_count: number;
  created_at: Date;
}

export async function getProductById(id: string): Promise<Product | null> {
  // $1 nhận ID qua tham số; chỉ đọc sản phẩm đang được bán.
  const result = await pool.query<ProductRow>(
    `SELECT id, name, original_price, sale_price, description,
            category_id, sold_count, created_at
     FROM products
     WHERE id = $1 AND is_active = true`,
    [id],
  );
  const product = result.rows[0];
  if (!product) return null;

  // Ba bảng liên quan được đọc riêng để tránh nhân đôi ảnh/biến thể khi JOIN tất cả.
  const [images, variants, styles] = await Promise.all([
    pool.query<{ url: string }>(
      "SELECT url FROM product_images WHERE product_id = $1 ORDER BY position",
      [id],
    ),
    pool.query<ProductVariant>(
      `SELECT id, color, size, stock FROM product_variants
       WHERE product_id = $1 AND is_active = true
       ORDER BY color, CASE size
         WHEN 'S' THEN 1 WHEN 'M' THEN 2 WHEN 'L' THEN 3
         WHEN 'XL' THEN 4 WHEN 'XXL' THEN 5 END, id`,
      [id],
    ),
    pool.query<{ style_id: string }>(
      "SELECT style_id FROM product_styles WHERE product_id = $1 ORDER BY style_id",
      [id],
    ),
  ]);

  // Chuyển tên cột SQL sang cấu trúc Product hiện tại; giữ biến thể hết hàng để UI vô hiệu hóa.
  return {
    id: product.id,
    name: product.name,
    originalPrice: product.original_price,
    salePrice: product.sale_price ?? undefined,
    description: product.description,
    categoryId: product.category_id,
    soldCount: product.sold_count,
    createdAt: product.created_at.toISOString(),
    images: images.rows.map((image) => image.url),
    variants: variants.rows,
    styleIds: styles.rows.map((style) => style.style_id),
  };
}

export async function getProducts(): Promise<Product[]> {
  // Lấy ID sản phẩm đang bán; thêm id để thứ tự ổn định khi ngày tạo trùng nhau.
  const result = await pool.query<{ id: string }>(
    `SELECT id FROM products
     WHERE is_active = true
     ORDER BY created_at DESC, id`,
  );

  // Tái sử dụng hàm đọc đầy đủ sản phẩm; Promise.all giữ thứ tự của danh sách ID.
  const products = await Promise.all(
    result.rows.map((item) => getProductById(item.id)),
  );

  // Bỏ sản phẩm không còn hoạt động giữa hai lần truy vấn; danh sách trống trả về [].
  return products.filter((item): item is Product => item !== null);
}

export async function getShopProducts(
  filters: ProductFilters,
  sort: ShopSortOrder,
  requestedPage: number,
): Promise<ShopPageData> {
  const values: unknown[] = [filters.priceRange[0], filters.priceRange[1]];
  const conditions = ["p.is_active = true", "COALESCE(p.sale_price, p.original_price) BETWEEN $1 AND $2"];
  if (filters.categoryId) {
    values.push(filters.categoryId);
    conditions.push(`p.category_id = $${values.length}`);
  }
  // EXISTS lọc quan hệ nhiều-nhiều mà không nhân đôi sản phẩm; nhiều style dùng điều kiện OR.
  if (filters.styleIds.length > 0) {
    values.push(filters.styleIds);
    conditions.push(`EXISTS (SELECT 1 FROM product_styles ps WHERE ps.product_id = p.id AND ps.style_id = ANY($${values.length}::text[]))`);
  }
  if (filters.size) {
    values.push(filters.size);
    conditions.push(`EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.size = $${values.length} AND pv.is_active = true AND pv.stock > 0)`);
  }
  const where = conditions.join(" AND ");
  // ORDER BY không nhận dữ liệu URL trực tiếp: chỉ chọn từ các biểu thức cố định.
  const orders: Record<ShopSortOrder, string> = {
    newest: "p.created_at DESC, p.id",
    oldest: "p.created_at ASC, p.id",
    "price-asc": "COALESCE(p.sale_price, p.original_price) ASC, p.id",
    "price-desc": "COALESCE(p.sale_price, p.original_price) DESC, p.id",
    name: "LOWER(p.name) ASC, p.id",
    bestselling: "p.sold_count DESC, p.id",
  };
  const order = orders[sort] ?? orders.newest;
  const client = await pool.connect();
  try {
    // Đếm tổng và lấy trang trên cùng snapshot để dữ liệu không lệch khi có cập nhật đồng thời.
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const count = await client.query<{ total: number }>(
      `SELECT COUNT(*)::integer AS total FROM products p WHERE ${where}`,
      values,
    );
    const total = count.rows[0].total;
    const pageCount = Math.max(1, Math.ceil(total / shopPageSize));
    const page = Math.min(pageCount, Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
    const result = await client.query<ProductRow>(
      `SELECT p.id, p.name, p.original_price, p.sale_price, p.description,
              p.category_id, p.sold_count, p.created_at
       FROM products p WHERE ${where}
       ORDER BY ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, shopPageSize, (page - 1) * shopPageSize],
    );
    const ids = result.rows.map((item) => item.id);
    const products: Product[] = [];
    if (ids.length > 0) {
      // Đọc ảnh, biến thể, style theo cả nhóm ID; không gọi nhiều truy vấn cho từng card.
      const images = await client.query<{ product_id: string; url: string }>(
        "SELECT product_id, url FROM product_images WHERE product_id = ANY($1::text[]) ORDER BY product_id, position",
        [ids],
      );
      const variants = await client.query<ProductVariant & { product_id: string }>(
        `SELECT product_id, id, color, size, stock FROM product_variants
         WHERE product_id = ANY($1::text[]) AND is_active = true ORDER BY product_id, color,
         CASE size WHEN 'S' THEN 1 WHEN 'M' THEN 2 WHEN 'L' THEN 3 WHEN 'XL' THEN 4 WHEN 'XXL' THEN 5 END, id`,
        [ids],
      );
      const styles = await client.query<{ product_id: string; style_id: string }>(
        "SELECT product_id, style_id FROM product_styles WHERE product_id = ANY($1::text[]) ORDER BY product_id, style_id",
        [ids],
      );
      for (const item of result.rows) {
        products.push({
          id: item.id, name: item.name, originalPrice: item.original_price,
          salePrice: item.sale_price ?? undefined, description: item.description,
          categoryId: item.category_id, soldCount: item.sold_count,
          createdAt: item.created_at.toISOString(),
          images: images.rows.filter((image) => image.product_id === item.id).map((image) => image.url),
          variants: variants.rows.filter((variant) => variant.product_id === item.id).map(({ id, color, size, stock }) => ({ id, color, size, stock })),
          styleIds: styles.rows.filter((style) => style.product_id === item.id).map((style) => style.style_id),
        });
      }
    }
    await client.query("COMMIT");
    return { products, total, page, pageCount, sort };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getSuggestedProducts(
  categoryId: string,
  currentProductId: string,
): Promise<Product[]> {
  // $1 là danh mục, $2 là sản phẩm đang xem; lấy tối đa 4 sản phẩm bán chạy cùng danh mục.
  const result = await pool.query<{ id: string }>(
    `SELECT id FROM products
     WHERE category_id = $1 AND id <> $2 AND is_active = true
     ORDER BY sold_count DESC, id
     LIMIT 4`,
    [categoryId, currentProductId],
  );

  // Đọc đầy đủ dữ liệu cho từng card; Promise.all giữ thứ tự bán chạy từ truy vấn trên.
  const suggestedProducts = await Promise.all(
    result.rows.map((item) => getProductById(item.id)),
  );

  // Sản phẩm có thể bị ngừng bán giữa hai lần đọc nên loại bỏ kết quả null.
  return suggestedProducts.filter((item): item is Product => item !== null);
}

// Đọc các lựa chọn bộ lọc từ PostgreSQL; slug dùng để tạo URL, id dùng để liên kết sản phẩm.
export async function getCategories(): Promise<Category[]> {
  const result = await pool.query<Category>(
    "SELECT id, name, slug FROM categories ORDER BY name, id",
  );
  return result.rows;
}

export async function getStyles(): Promise<Style[]> {
  const result = await pool.query<Style>(
    "SELECT id, name, slug FROM styles ORDER BY name, id",
  );
  return result.rows;
}

// Đọc danh mục từ PostgreSQL, gồm slug để tạo URL.
export async function getCategoryById(id: string) {
  const result = await pool.query<{
    id: string;
    name: string;
    slug: string;
  }>("SELECT id, name, slug FROM categories WHERE id = $1", [id]);

  return result.rows[0] ?? null;
}
