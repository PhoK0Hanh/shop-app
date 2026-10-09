import type { Color } from './catalog';

// Chỉ dịch nhãn hiển thị; giá trị màu trong API/database giữ nguyên để chọn đúng biến thể.
export const colorLabels:Record<Color,string>={
  Black:'Đen',White:'Trắng',Gray:'Xám',Navy:'Xanh navy',Blue:'Xanh dương',
  Beige:'Be',Green:'Xanh lá',Burgundy:'Đỏ rượu vang',
};
export function getColorLabel(color:string):string {
  const key=Object.keys(colorLabels).find(key=>key.toLowerCase()===color.toLowerCase()) as Color|undefined;
  return key?colorLabels[key]:color;
}

// Đơn cũ giữ snapshot gốc; UI có thể dịch tên của bộ sản phẩm mẫu mà không sửa lịch sử.
export const productNameLabels:Record<string,string>={
  'Basic Cotton T-shirt':'Áo thun cotton cơ bản',
  'Slim Fit Dress Shirt':'Áo sơ mi dáng ôm',
  'Oversized Hoodie':'Áo hoodie dáng rộng',
  'Slim Jeans':'Quần jeans dáng ôm',
  'Gym Performance Shorts':'Quần short tập luyện',
  'Party Print Shirt':'Áo sơ mi họa tiết dự tiệc',
  'Casual Graphic Tee':'Áo thun in hình',
  'Formal Slacks':'Quần tây lịch sự',
  'Oversized Cotton Tee':'Áo thun cotton dáng rộng',
  'Classic Oxford Shirt':'Áo sơ mi Oxford cổ điển',
  'Zip-Up Fleece Hoodie':'Áo hoodie nỉ khóa kéo',
  'Straight Fit Denim Jeans':'Quần jeans ống đứng',
  'Lightweight Training Shorts':'Quần short thể thao nhẹ',
};
export function getProductNameLabel(name:string):string{return Object.hasOwn(productNameLabels,name)?productNameLabels[name]:name;}
