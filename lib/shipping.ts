import type { ShippingInfo } from './order-types';

// Dùng chung cho form và API; server luôn kiểm tra lại dù client đã kiểm tra.
export function parseShipping(value: unknown): ShippingInfo {
  if (!value || typeof value !== 'object') throw new Error('Vui lòng nhập thông tin giao hàng.');
  const input = value as Record<string, unknown>;
  const recipientName = typeof input.recipientName === 'string' ? input.recipientName.trim() : '';
  const rawPhone = typeof input.phone === 'string' ? input.phone.trim() : '';
  const address = typeof input.address === 'string' ? input.address.trim() : '';
  const note = typeof input.note === 'string' ? input.note.trim() : '';
  if (recipientName.length < 2 || recipientName.length > 100) throw new Error('Tên người nhận cần từ 2 đến 100 ký tự.');
  if (rawPhone.length > 30) throw new Error('Số điện thoại không hợp lệ.');
  const phone = rawPhone.replace(/[\s().-]/g, '').replace(/^\+84/, '0');
  if (!/^0\d{9}$/.test(phone)) throw new Error('Nhập số điện thoại Việt Nam gồm 10 số hoặc bắt đầu bằng +84.');
  if (address.length < 10 || address.length > 500) throw new Error('Địa chỉ cần từ 10 đến 500 ký tự, gồm số nhà, đường và phường/xã, tỉnh/thành.');
  if (input.note !== undefined && typeof input.note !== 'string') throw new Error('Ghi chú không hợp lệ.');
  if (note.length > 1000) throw new Error('Ghi chú tối đa 1000 ký tự.');
  return { recipientName, phone, address, note };
}
