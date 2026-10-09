"use client";

import type { User } from "firebase/auth";
import { api } from "@/lib/api";

export class SessionRequestError extends Error {}

async function requestSession(method: "POST" | "DELETE", idToken?: string) {
  try {
    // Cookie HttpOnly do server quản lý; không lưu ID token vào localStorage.
    const response = await api.request({
      url: "/auth/session",
      method,
      validateStatus: () => true,
      ...(method === "POST" ? {
        headers: { "Content-Type": "application/json" },
        data: { idToken },
      } : {}),
    });
    if (response.status < 200 || response.status >= 300) {
      // Chỉ hiển thị thông báo cho các mã lỗi hồ sơ đã biết; không đưa lỗi server thô lên UI.
      const payload = response.data;
      const messages: Record<string, string> = {
        USER_DISABLED: "Tài khoản đã bị khóa trên website.",
        EMAIL_CONFLICT: "Email đã thuộc hồ sơ khác. Vui lòng liên hệ quản trị viên để liên kết tài khoản.",
        PROFILE_INVALID: "Tài khoản Firebase cần có UID và email hợp lệ.",
      };
      if (payload && typeof payload.code === "string" && Object.hasOwn(messages, payload.code)) {
        throw new SessionRequestError(messages[payload.code]);
      }
      throw new SessionRequestError(method === "POST"
        ? "Chưa tạo được phiên website. Vui lòng đăng nhập lại hoặc thử lại sau."
        : "Chưa xóa được phiên website. Vui lòng thử đăng xuất lại.");
    }
  } catch (error) {
    if (error instanceof SessionRequestError) throw error;
    throw new SessionRequestError("Không thể kết nối với website. Vui lòng kiểm tra mạng và thử lại.");
  }
}

export async function createServerSession(user: User) {
  // Làm mới token sau updateProfile để cookie chứa họ tên vừa cập nhật.
  await requestSession("POST", await user.getIdToken(true));
}

export async function clearServerSession() {
  await requestSession("DELETE");
}
