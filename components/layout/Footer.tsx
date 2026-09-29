import Link from "next/link";
import { FaXTwitter, FaFacebook, FaInstagram, FaGithub } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="bg-gray-300">
      <div className="mx-auto p-10">
        <div className="grid grid-cols-5">
          <div>
            <div className="text-2xl font-bold text-black">SHOP.CO</div>
            <div>
              We have clothes that suits your style and which you're proud to
              wear. From women to men
            </div>
            <div className="flex gap-5">
              <FaXTwitter />
              <FaFacebook />
              <FaInstagram />
              <FaGithub />
            </div>
          </div>
          <div>
            <h3>COMPANY</h3>
            <div>
              <div>About</div>
              <div>Feature</div>
              <div>Works</div>
              <div>Career</div>
            </div>
          </div>
          <div>
            <h3>HELP</h3>
            <div>
              <div>Customer Support</div>
              <div>Delivery Detail</div>
              <div>Term & Conditions</div>
              <div>Privacy Policy</div>
            </div>
          </div>
          <div>
            <h3>FAQ</h3>
            <div>
              <div>Account</div>
              <div>Manage Deliveries</div>
              <div>Orders</div>
              <div>Payments</div>
            </div>
          </div>
          <div>
            <h3>RESOURCES</h3>
            <div>
              <div>Free eBooks</div>
              <div>Development Tutorial</div>
              <div>How to - Blog</div>
              <div>Youtube Playlist</div>
            </div>
          </div>
        </div>
        <div className="border-t ">
          Shop.co © 2002-2026, All Rights Reserved
        </div>
      </div>
    </footer>
  );
}
