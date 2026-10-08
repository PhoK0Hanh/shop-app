import Link from "next/link";
import { FaXTwitter, FaFacebook, FaInstagram, FaGithub } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="bg-[#F2F0F1]">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="text-4xl font-bold text-black">SHOP.CO</div>
            {/* Dùng HTML entity cho dấu nháy đơn trong nội dung JSX để đạt quy tắc lint. */}
            <div className="max-w-xs">
              We have clothes that suits your style and which you&apos;re proud to
              wear. From women to men
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
            <h3 className="font-bold">COMPANY</h3>
            <div className="flex flex-col gap-1">
              <Link href="/test" className="hover:text-gray-500">
                About
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Feature
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Works
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Career
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold">HELP</h3>
            <div className="flex flex-col gap-1">
              <Link href="/test" className="hover:text-gray-500">
                Customer Support
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Delivery Detail
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Term & Conditions
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Privacy Policy
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold">FAQ</h3>
            <div className="flex flex-col gap-1">
              <Link href="/test" className="hover:text-gray-500">
                Account
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Manage Deliveries
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Orders
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Payments
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold">RESOURCES</h3>
            <div className="flex flex-col gap-1">
              <Link href="/test" className="hover:text-gray-500">
                Free eBooks
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Development Tutorial
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                How to - Blog
              </Link>
              <Link href="/test" className="hover:text-gray-500">
                Youtube Playlist
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t mt-6 py-4">
          Shop.co © 2002-2026, All Rights Reserved
        </div>
      </div>
    </footer>
  );
}
