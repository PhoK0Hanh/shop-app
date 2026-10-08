"use client";

import type { User } from "firebase/auth";

export class SessionRequestError extends Error {}

async function requestSession(method: "POST" | "DELETE", idToken?: string) {
  try {
    // Cookie HttpOnly do server quản lý; không lưu ID token vào localStorage.
    const response = await fetch("/api/auth/session", {
      method,
      credentials: "same-origin",
      cache: "no-store",
      ...(method === "POST" ? {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      } : {}),
    });
    if (!response.ok) {
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
