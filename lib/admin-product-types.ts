import type { Product, ProductVariant } from './catalog';
// Metadata phục vụ chỉnh sửa và kiểm tra xung đột, không đưa vào catalog công khai.
export interface AdminVariant extends ProductVariant { isActive: boolean; hasOrders: boolean }
export interface AdminProduct extends Omit<Product, 'variants'> {
  variants: AdminVariant[]; isActive: boolean; hasOrders: boolean; version: string;
}
export type ProductDraft = Omit<AdminProduct, 'soldCount' | 'createdAt' | 'hasOrders'>;
