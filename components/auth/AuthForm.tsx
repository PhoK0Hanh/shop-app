"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

const inputClass = "h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition-colors focus:border-black focus:bg-white";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const username = String(data.get("username") ?? "").trim();
    const password = String(data.get("password") ?? "");
    setError("");
    setSuccess(false);

    if (!username || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }
    if (isSignup) {
      if (!String(data.get("name") ?? "").trim()) {
        setError("Vui lòng nhập họ và tên.");
        return;
      }
      if (password.length < 6) {
        setError("Mật khẩu cần ít nhất 6 ký tự.");
        return;
      }
      if (password !== data.get("confirmPassword")) {
        setError("Mật khẩu xác nhận chưa khớp.");
        return;
      }
      setSuccess(true);
    } else if (username === "admin" && password === "1234") {
      setSuccess(true);
    } else {
      setError("Tên đăng nhập hoặc mật khẩu không đúng.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
      <Link href="/" className="text-sm text-gray-500 transition-colors hover:text-black">
        Home
      </Link>
      <div className="mt-6 grid overflow-hidden rounded-3xl border border-gray-200 bg-white lg:grid-cols-2 lg:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-black p-12 text-white lg:flex">
          <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full border border-white/15" />
          <div className="pointer-events-none absolute -bottom-40 -left-32 size-[480px] rounded-full border border-white/15" />
          <Link href="/" className="relative text-4xl font-bold tracking-tight">SHOP.CO</Link>
          <div className="relative my-16 space-y-6">
            <span className="text-xs font-medium tracking-[0.25em] text-gray-400">YOUR STYLE STARTS HERE</span>
            <h2 className="max-w-md text-5xl font-bold leading-tight">
              Phong cách của bạn.<br />Dấu ấn của bạn.
            </h2>
            <p className="max-w-sm leading-relaxed text-gray-400">
              Khám phá những thiết kế phù hợp với bạn và tìm cảm hứng cho mỗi ngày.
            </p>
          </div>
          <Link href="/shop" className="relative flex w-fit items-center gap-2 text-sm font-medium hover:text-gray-300">
            Khám phá bộ sưu tập <ArrowRight size={18} />
          </Link>
        </div>

        <div className="px-6 py-8 sm:px-10 lg:p-12">
          <div className="mx-auto max-w-sm">
            <p className="mb-2 text-xs font-semibold tracking-widest text-gray-500">
              {isSignup ? "JOIN SHOP.CO" : "WELCOME BACK"}
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">{isSignup ? "Tạo tài khoản" : "Đăng nhập"}</h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              {isSignup ? "Bắt đầu hành trình tìm phong cách của riêng bạn." : "Chào mừng bạn quay lại SHOP.CO."}
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit} onChange={() => { setError(""); setSuccess(false); }}>
              {isSignup && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="auth-name" className="block text-sm font-medium">Họ và tên</label>
                    <input id="auth-name" name="name" autoComplete="name" required placeholder="Nhập họ và tên" className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="auth-email" className="block text-sm font-medium">Email</label>
                    <input id="auth-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" className={inputClass} />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <label htmlFor="auth-username" className="block text-sm font-medium">Tên đăng nhập</label>
                <input id="auth-username" name="username" autoComplete="username" required placeholder="Nhập tên đăng nhập" className={inputClass} />
              </div>
              <div className="space-y-2">
                <label htmlFor="auth-password" className="block text-sm font-medium">Mật khẩu</label>
                <div className="relative">
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    minLength={isSignup ? 6 : undefined}
                    required
                    placeholder={isSignup ? "Ít nhất 6 ký tự" : "Nhập mật khẩu"}
                    className={`${inputClass} pr-12`}
                  />
                  <button type="button" title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((current) => !current)} className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-black">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {isSignup && (
                <div className="space-y-2">
                  <label htmlFor="auth-confirm" className="block text-sm font-medium">Xác nhận mật khẩu</label>
                  <input id="auth-confirm" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={6} placeholder="Nhập lại mật khẩu" className={inputClass} />
                </div>
              )}

              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
              {success && (
                <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                  {isSignup ? "Thông tin hợp lệ. Đây là form demo, tài khoản chưa được tạo." : "Đăng nhập demo thành công."}
                  {!isSignup && <Link href="/shop" className="mt-2 block font-semibold underline">Tiếp tục mua sắm</Link>}
                </div>
              )}
              <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-5 font-medium text-white transition-colors hover:bg-[#383838]">
                {isSignup ? "Tạo tài khoản" : "Đăng nhập"} <ArrowRight size={18} />
              </button>
            </form>

            {!isSignup && (
              <p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
                Tài khoản demo: <span className="font-semibold text-black">admin</span> · Mật khẩu: <span className="font-semibold text-black">1234</span>
              </p>
            )}
            <p className="mt-6 text-center text-sm text-gray-500">
              {isSignup ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
              <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-black underline underline-offset-4">
                {isSignup ? "Đăng nhập" : "Đăng ký"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
