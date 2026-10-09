// Chạy: node --env-file=.env.local scripts/localize-catalog.mjs
// Chỉ dịch tên dữ liệu mẫu còn nguyên; không đổi ID/slug/biến thể hoặc snapshot đơn hàng.
import pg from 'pg';
import { productNameLabels } from '../lib/catalog-labels.ts';

const categories={ 'T-shirts':'Áo thun',Shorts:'Quần short',Shirts:'Áo sơ mi',Hoodie:'Áo hoodie',Jeans:'Quần jeans' };
const styles={Casual:'Thường ngày',Formal:'Lịch sự',Party:'Dự tiệc',Gym:'Thể thao'};
const descriptions={
  'Basic Cotton T-shirt':'Áo thun cotton dáng vừa, chất liệu thoáng mát, phù hợp mặc hằng ngày.',
  'Slim Fit Dress Shirt':'Áo sơ mi dáng ôm, vải không nhăn, phù hợp đi làm hoặc dự tiệc.',
  'Oversized Hoodie':'Áo hoodie dáng rộng, nỉ bông dày dặn, giữ ấm tốt.',
  'Slim Jeans':'Quần jeans dáng ôm, co giãn nhẹ, dễ phối đồ.',
  'Gym Performance Shorts':'Quần short tập luyện, vải co giãn bốn chiều, thấm hút mồ hôi.',
  'Party Print Shirt':'Áo sơ mi họa tiết, chất liệu lụa mềm, nổi bật trong các buổi tiệc.',
  'Casual Graphic Tee':'Áo thun in hình, chất liệu cotton 100%, dáng vừa.',
  'Formal Slacks':'Quần tây dáng ôm, vải cao cấp, phù hợp đi làm.',
  'Oversized Cotton Tee':'Áo thun cotton dáng rộng, mềm mại, dễ phối đồ hằng ngày.',
  'Classic Oxford Shirt':'Áo sơ mi Oxford cổ điển, dáng vừa, phù hợp đi làm và gặp gỡ.',
  'Zip-Up Fleece Hoodie':'Áo hoodie khóa kéo, lớp nỉ mềm giữ ấm, tiện mặc khi ra ngoài.',
  'Straight Fit Denim Jeans':'Quần jeans ống đứng, chất vải denim bền đẹp, phù hợp nhiều phong cách.',
  'Lightweight Training Shorts':'Quần short thể thao nhẹ, nhanh khô, thoải mái khi vận động.',
};
const client=new pg.Client({connectionTimeoutMillis:5000});
try {
  await client.connect();await client.query('BEGIN');
  const counts={categories:0,styles:0,products:0};
  for(const [table,labels] of [['categories',categories],['styles',styles]]) {
    // Tên bảng thuộc danh sách cố định, các tên hiển thị được truyền bằng tham số SQL.
    for(const [before,after] of Object.entries(labels))counts[table]+=(await client.query(`UPDATE public.${table} SET name=$1 WHERE name=$2`,[after,before])).rowCount;
  }
  for(const [before,after] of Object.entries(productNameLabels)) {
    counts.products+=(await client.query('UPDATE public.products SET name=$1,description=$2,updated_at=CURRENT_TIMESTAMP WHERE name=$3',[after,descriptions[before],before])).rowCount;
  }
  await client.query('COMMIT');console.log(JSON.stringify(counts));
} catch(error) {await client.query('ROLLBACK').catch(()=>{});console.error(error.message);process.exitCode=1;}
finally {await client.end();}
