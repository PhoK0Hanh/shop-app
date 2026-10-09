import Link from "next/link";
import { FaXTwitter, FaFacebook, FaInstagram, FaGithub } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="bg-[#F2F0F1]">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="text-4xl font-bold text-black">SHOP.CO</div>
            {/* Nội dung giới thiệu cửa hàng dùng cùng ngôn ngữ với giao diện mua sắm. */}
            <div className="max-w-xs">
              Trang phục dành cho nam và nữ, giúp bạn tự tin thể hiện phong cách riêng.
            </div>
            <div className="flex gap-4 mt-4">
              <Link href="/test" className="hover:text-gray-500">
                <FaXTwitter size={24} />
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                <FaFacebook size={24} />
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                <FaInstagram size={24} />
              </Link>
              <Link
                href="https://github.com/PhoK0Hanh"
                className="hover:text-gray-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGithub size={24} />
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold">VỀ SHOP.CO</h3>
            <div className="flex flex-col gap-1">
              <Link href="/test" className="hover:text-gray-500">
                Giới thiệu
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Điểm nổi bật
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Hoạt động
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Tuyển dụng
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold">HỖ TRỢ</h3>
            <div className="flex flex-col gap-1">
              <Link href="/test" className="hover:text-gray-500">
                Hỗ trợ khách hàng
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Thông tin giao hàng
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Điều khoản sử dụng
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Chính sách bảo mật
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold">CÂU HỎI THƯỜNG GẶP</h3>
            <div className="flex flex-col gap-1">
              <Link href="/test" className="hover:text-gray-500">
                Tài khoản
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Quản lý giao hàng
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Đơn hàng
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Thanh toán
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold">TÀI NGUYÊN</h3>
            <div className="flex flex-col gap-1">
              <Link href="/test" className="hover:text-gray-500">
                Sách điện tử miễn phí
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Hướng dẫn phát triển
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Bài viết hướng dẫn
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Danh sách video YouTube
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t mt-6 py-4">
          Shop.co © 2002-2026, Bảo lưu mọi quyền
        </div>
      </div>
    </footer>
  );
}
