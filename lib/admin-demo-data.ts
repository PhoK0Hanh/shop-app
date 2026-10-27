import type { AdminProduct } from './admin-product-types';
import type { AdminOrder } from './admin-order-types';
import type { AdminUser } from './admin-user-types';
import type { Category, Style } from './catalog';

export const demoStorageKey = 'shop-admin-demo-v1';
export const demoAdminId = 'demo-admin';
export interface DemoOrder extends AdminOrder { userId: string }
export interface DemoData {
  schema: 1;
  products: AdminProduct[];
  orders: DemoOrder[];
  users: AdminUser[];
  categories: Category[];
  styles: Style[];
}

// Bộ dữ liệu độc lập, không lấy thông tin khách hàng hoặc sản phẩm từ database thật.
export function createDemoData(now = new Date()): DemoData {
  const categories = ['Áo thun', 'Quần jeans', 'Áo sơ mi', 'Áo hoodie', 'Quần short'].map((name, i) => ({ id: `demo-cat-${i}`, name, slug: `demo-category-${i}` }));
  const styles = ['Hằng ngày', 'Lịch sự', 'Dự tiệc', 'Thể thao'].map((name, i) => ({ id: `demo-style-${i}`, name, slug: `demo-style-${i}` }));
  const names = ['Áo thun cotton', 'Quần jeans dáng suông', 'Áo sơ mi linen', 'Áo hoodie basic', 'Quần short thể thao', 'Áo thun kẻ sọc', 'Quần jeans xanh', 'Áo sơ mi trắng', 'Áo hoodie xám', 'Quần short kaki', 'Áo thun oversize', 'Quần jeans đen'];
  const products: AdminProduct[] = names.map((name, i) => ({
    id: `demo-product-${i + 1}`, name, description: `${name} — sản phẩm giả để trải nghiệm quản trị.`,
    categoryId: categories[i % categories.length].id, styleIds: [styles[i % styles.length].id],
    originalPrice: 150000 + i * 25000, salePrice: i % 3 === 0 ? 120000 + i * 25000 : undefined,
    images: ['/images/demo-product.svg'], isActive: i !== 10, hasOrders: false,
    soldCount: 0, createdAt: now.toISOString(), version: `seed-${i}`,
    variants: ['S', 'M', 'L'].map((size, j) => ({ id: `demo-variant-${i}-${j}`, size: size as 'S' | 'M' | 'L', color: i % 2 ? 'White' : 'Black', stock: (i + j) % 5 === 0 ? 2 : 20, isActive: true, hasOrders: false })),
  }));
  const users: AdminUser[] = Array.from({ length: 8 }, (_, i) => ({
    id: i === 0 ? demoAdminId : `demo-user-${i}`, name: i === 0 ? 'Quản trị viên demo' : `Khách hàng mẫu ${i}`,
    email: i === 0 ? 'admin@example.invalid' : `customer${i}@example.invalid`, role: i === 0 ? 'admin' : 'customer',
    isActive: i !== 7, firebaseLinked: true, createdAt: now.toISOString(), orderCount: 0,
  }));
  const orders: DemoOrder[] = [];
  for (let day = 0; day < 30; day++) {
    for (let n = 0; n < 1 + day % 3; n++) {
      const index = orders.length;
      const user = users[1 + index % 7];
      const product = products[index % 8];
      const variant = product.variants[index % 3];
      const status = (['preparing', 'shipping', 'delivered', 'cancelled'] as const)[index % 4];
      const quantity = 1 + index % 2;
      const date = new Date(now.getTime() - day * 86400000);
      const unitPrice = product.salePrice ?? product.originalPrice;
      orders.push({
        id: `demo-order-${index + 1}`, userId: user.id, customerName: user.name, customerEmail: user.email,
        status, total: unitPrice * quantity, createdAt: date.toISOString(),
        shipping: { recipientName: user.name, phone: '0000000000', address: 'Địa chỉ giả lập — không dùng để giao hàng', note: 'Đơn minh họa, không có khách hàng thật.' },
        items: [{ id: `demo-item-${index}`, productId: product.id, productName: product.name, color: variant.color, size: variant.size, quantity, unitPrice }],
      });
      user.orderCount++;
      product.hasOrders = true;
      variant.hasOrders = true;
      if (status !== 'cancelled') product.soldCount += quantity;
    }
  }
  return { schema: 1, products, orders, users, categories, styles };
}
