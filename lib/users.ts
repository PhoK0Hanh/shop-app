import "server-only";

import { randomUUID } from "node:crypto";
import { pool } from "@/lib/db";

export type UserProfile = {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

export class UserProfileError extends Error {
  constructor(public code: "USER_DISABLED" | "EMAIL_CONFLICT" | "PROFILE_INVALID", public status: number, message: string) {
    super(message);
  }
}

export async function syncFirebaseUser(claims: { uid: string; email?: string; name?: unknown }): Promise<UserProfile> {
  const email = claims.email?.trim().toLowerCase() ?? "";
  if (!claims.uid || claims.uid.length > 128 || claims.uid !== claims.uid.trim()
    || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new UserProfileError("PROFILE_INVALID", 400, "Tài khoản Firebase cần có UID và email hợp lệ.");
  }
  const name = (typeof claims.name === "string" && claims.name.trim()
    ? claims.name.trim() : email.split("@")[0]).slice(0, 100);
  try {
    // UID đã được Firebase Admin xác thực; không ghép tài khoản theo email hoặc nhận role từ form.
    const result = await pool.query<UserProfile>(`
      INSERT INTO public.users (id, firebase_uid, name, email, role)
      VALUES ($1, $2, $3, $4, 'customer')
      ON CONFLICT (firebase_uid) DO UPDATE
        SET name = EXCLUDED.name, email = EXCLUDED.email, updated_at = CURRENT_TIMESTAMP
        WHERE users.is_active = true
      RETURNING id, firebase_uid AS uid, name, email, role
    `, [randomUUID(), claims.uid, name, email]);
    if (!result.rows[0]) {
      throw new UserProfileError("USER_DISABLED", 403, "Tài khoản đã bị khóa trên website.");
    }
    return result.rows[0];
  } catch (error) {
    // UNIQUE vẫn chống trùng khi nhiều yêu cầu đăng nhập chạy đồng thời.
    if (error && typeof error === "object" && "code" in error && error.code === "23505"
      && "constraint" in error && error.constraint === "users_email_key") {
      throw new UserProfileError("EMAIL_CONFLICT", 409, "Email đã thuộc hồ sơ khác. Vui lòng liên hệ quản trị viên để liên kết tài khoản.");
    }
    throw error;
  }
}

export async function getUserByFirebaseUid(uid: string): Promise<UserProfile | null> {
  // Mỗi lần kiểm tra phiên đều đọc trạng thái hiện tại từ DB để khóa tài khoản có hiệu lực ngay.
  const result = await pool.query<UserProfile>(`
    SELECT id, firebase_uid AS uid, name, email, role
    FROM public.users
    WHERE firebase_uid = $1 AND is_active = true
  `, [uid]);
  return result.rows[0] ?? null;
}
