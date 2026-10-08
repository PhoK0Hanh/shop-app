import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";
import { getAuthReturnTo } from "@/lib/auth-redirect";

export const metadata: Metadata = { title: "Đăng ký | SHOP.CO" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  // Giữ đích ban đầu khi người dùng chuyển giữa đăng nhập và đăng ký.
  const { next } = await searchParams;
  return <AuthForm mode="signup" returnTo={getAuthReturnTo(next)} />;
}
