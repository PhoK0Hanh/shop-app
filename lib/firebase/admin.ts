import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export class FirebaseAdminConfigError extends Error {}

export function getAdminAuth() {
  // Khởi tạo khi cần dùng để trang công khai vẫn chạy khi chưa cấu hình Admin SDK.
  const name = "shop-server";
  const existing = getApps().find((app) => app.name === name);
  if (existing) return getAuth(existing);

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey?.trim()) {
    throw new FirebaseAdminConfigError("Firebase Admin chưa được cấu hình.");
  }

  const app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  }, name);
  return getAuth(app);
}
