import type { Order } from './order-types';
// Thông tin tài khoản chỉ xuất hiện ở API quản trị đã kiểm tra role.
export interface AdminOrder extends Order { customerName:string; customerEmail:string; }
