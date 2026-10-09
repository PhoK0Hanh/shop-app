import type { OrderStatus } from './order-types';
// Một snapshot tổng quan; thống kê kho/tài khoản độc lập với kỳ thống kê đơn.
export type OverviewRange='7d'|'30d'|'month';
export interface AdminOverview {
  range:OverviewRange;from:string;to:string;
  orders:Record<OrderStatus,number>&{total:number;deliveredValue:number};
  days:{date:string;count:number}[];
  products:{total:number;active:number;hidden:number};
  customers:{total:number;locked:number};
  lowStockCount:number;
  lowStock:{id:string;productId:string;name:string;color:string;size:string;stock:number}[];
  recent:{id:string;recipient:string;status:OrderStatus;total:number;createdAt:string}[];
}
