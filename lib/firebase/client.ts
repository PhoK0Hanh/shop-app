"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Next.js đưa các biến NEXT_PUBLIC_* vào bundle trình duyệt; chỉ dùng cấu hình web Firebase.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (Object.values(firebaseConfig).some((value) => !value?.trim())) {
  throw new Error(
    "Thiếu cấu hình Firebase web. Kiểm tra bốn biến NEXT_PUBLIC_FIREBASE_* trong .env.local và khởi động lại server dev.",
  );
}

// Tái sử dụng app mặc định khi Next.js tải lại module trong development.
const app = getApps().some((item) => item.name === "[DEFAULT]")
  ? getApp()
  : initializeApp(firebaseConfig);

// Auth dùng để đăng ký, đăng nhập và đăng xuất; chưa tự đăng nhập hoặc tạo tài khoản.
export const auth = getAuth(app);
