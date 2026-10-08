import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";
import { getAuthReturnTo } from "@/lib/auth-redirect";

export const metadata: Metadata = { title: "Đăng nhập | SHOP.CO" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  // Xác thực đích quay về trước khi truyền xuống form đăng nhập.
  const { next } = await searchParams;
  return <AuthForm mode="login" returnTo={getAuthReturnTo(next)} />;
}
