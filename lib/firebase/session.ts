import "server-only";

import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE = "shop_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 5;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function isInvalidFirebaseToken(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  return typeof code === "string" && [
    "auth/argument-error",
    "auth/invalid-id-token",
    "auth/id-token-expired",
    "auth/id-token-revoked",
    "auth/invalid-session-cookie",
    "auth/session-cookie-expired",
    "auth/session-cookie-revoked",
    "auth/user-disabled",
    "auth/user-not-found",
  ].includes(code);
}

export async function getSessionUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    // Chỉ tin cookie được Admin SDK xác thực; kiểm tra cả việc khóa/thu hồi tài khoản.
    const claims = await getAdminAuth().verifySessionCookie(token, true);
    return {
      uid: claims.uid,
      email: claims.email ?? null,
      name: typeof claims.name === "string" ? claims.name : null,
      emailVerified: claims.email_verified === true,
    };
  } catch (error) {
    if (isInvalidFirebaseToken(error)) return null;
    // Lỗi cấu hình hoặc kết nối phải được xử lý riêng, không giả thành người dùng đã đăng xuất.
    throw error;
  }
}
