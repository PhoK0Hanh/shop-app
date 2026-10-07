import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Đăng ký | SHOP.CO" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
