"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { createServerSession, SessionRequestError } from "@/lib/firebase/session-client";

// Chuyển mã lỗi Firebase thành thông báo dễ hiểu, không đưa lỗi kỹ thuật lên form.
function getAuthError(error: unknown) {
  if (error instanceof SessionRequestError) return error.message;
  if (!(error instanceof FirebaseError)) {
    return "Có lỗi xảy ra. Vui lòng thử lại.";
  }
  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email hoặc mật khẩu không đúng.";
    case "auth/email-already-in-use":
      return "Email này đã được đăng ký. Vui lòng đăng nhập.";
    case "auth/invalid-email":
      return "Địa chỉ email không hợp lệ.";
    case "auth/weak-password":
    case "auth/password-does-not-meet-requirements":
      return "Mật khẩu chưa đáp ứng yêu cầu bảo mật của hệ thống.";
    case "auth/too-many-requests":
      return "Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.";
    case "auth/network-request-failed":
      return "Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.";
    case "auth/user-disabled":
      return "Tài khoản đã bị vô hiệu hóa.";
    case "auth/operation-not-allowed":
      return "Đăng nhập bằng email/mật khẩu chưa được bật trong Firebase.";
    default:
      return "Không thể xác thực tài khoản. Vui lòng thử lại.";
  }
}

const inputClass =
  "h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition-colors focus:border-black focus:bg-white";

export default function AuthForm({
  mode,
  returnTo = "/",
}: {
  mode: "login" | "signup";
  returnTo?: string;
}) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || (isSignup && accountCreated)) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const name = String(data.get("name") ?? "").trim();
    const password = String(data.get("password") ?? "");
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }
    if (isSignup) {
      if (!name || name.length > 100) {
        setError("Vui lòng nhập họ và tên từ 1 đến 100 ký tự.");
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
    }
    submitting.current = true;
    setIsSubmitting(true);
    let created = false;
    try {
      if (isSignup) {
        // Firebase tự đăng nhập sau khi tạo tài khoản; chỉ lưu họ tên, không lưu mật khẩu.
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        created = true;
        setAccountCreated(true);
        let profileSaved = true;
        try {
          await updateProfile(user, { displayName: name });
        } catch {
          // Tài khoản đã tồn tại dù cập nhật hồ sơ lỗi, tránh yêu cầu người dùng đăng ký lại.
          profileSaved = false;
        }
        await createServerSession(user);
        setSuccess(profileSaved
          ? "Đăng ký thành công. Bạn đã được đăng nhập."
          : "Tài khoản đã được tạo và đăng nhập, nhưng chưa lưu được họ tên.");
        router.refresh();
      } else {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        // Chỉ quay về trang cũ sau khi backend đã tạo cookie thành công.
        const role = await createServerSession(user);
        setSuccess("Đăng nhập thành công.");
        // Admin vào khu quản trị; khách hàng vẫn quay về trang trước khi đăng nhập.
        router.replace(role === "admin" ? "/admin" : returnTo);
        router.refresh();
      }
    } catch (error) {
      setError(created
        ? "Tài khoản đã được tạo, nhưng chưa hoàn tất phiên website. Vui lòng chuyển sang đăng nhập để thử lại."
        : getAuthError(error));
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
      <Link
        href="/"
        className="text-sm text-gray-500 transition-colors hover:text-black"
      >
        Trang chủ
      </Link>
      <div className="mt-6 grid overflow-hidden rounded-3xl border border-gray-200 bg-white lg:grid-cols-2 lg:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-black p-12 text-white lg:flex">
          <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full border border-white/15" />
          <div className="pointer-events-none absolute -bottom-40 -left-32 size-120 rounded-full border border-white/15" />
          <Link href="/" className="relative text-4xl font-bold tracking-tight">
            SHOP.CO
          </Link>
          <div className="relative my-16 space-y-6">
            <span className="text-xs font-medium tracking-[0.25em] text-gray-400">
              PHONG CÁCH BẮT ĐẦU TỪ ĐÂY
            </span>
            <h2 className="max-w-md text-5xl font-bold leading-tight">
              Phong cách của bạn.
              <br />
              Dấu ấn của bạn.
            </h2>
            <p className="max-w-sm leading-relaxed text-gray-400">
              Khám phá những thiết kế phù hợp với bạn và tìm cảm hứng cho mỗi
              ngày.
            </p>
          </div>
          <Link
            href="/shop"
            className="relative flex w-fit items-center gap-2 text-sm font-medium hover:text-gray-300"
          >
            Khám phá bộ sưu tập <ArrowRight size={18} />
          </Link>
        </div>

        <div className="px-6 py-8 sm:px-10 lg:p-12">
          <div className="mx-auto max-w-sm">
            <p className="mb-2 text-xs font-semibold tracking-widest text-gray-500">
              {isSignup ? "THAM GIA SHOP.CO" : "CHÀO MỪNG TRỞ LẠI"}
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">
              {isSignup ? "Tạo tài khoản" : "Đăng nhập"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              {isSignup
                ? "Bắt đầu hành trình tìm phong cách của riêng bạn."
                : "Chào mừng bạn quay lại SHOP.CO."}
            </p>

            <form
              className="mt-8 space-y-4"
              onSubmit={handleSubmit}
              onChange={() => {
                setError("");
                setSuccess("");
              }}
            >
              {isSignup && (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="auth-name"
                      className="block text-sm font-medium"
                    >
                      Họ và tên
                    </label>
                    <input
                      id="auth-name"
                      name="name"
                      autoComplete="name"
                      disabled={isSubmitting}
                      maxLength={100}
                      required
                      placeholder="Nhập họ và tên"
                      className={inputClass}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <label
                  htmlFor="auth-email"
                  className="block text-sm font-medium"
                >
                  Email
                </label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  required
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="auth-password"
                  className="block text-sm font-medium"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    name="password"
                    disabled={isSubmitting}
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
                    minLength={isSignup ? 6 : undefined}
                    required
                    placeholder={isSignup ? "Ít nhất 6 ký tự" : "Nhập mật khẩu"}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    disabled={isSubmitting}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-black"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {isSignup && (
                <div className="space-y-2">
                  <label
                    htmlFor="auth-confirm"
                    className="block text-sm font-medium"
                  >
                    Xác nhận mật khẩu
                  </label>
                  <input
                    id="auth-confirm"
                    name="confirmPassword"
                    disabled={isSubmitting}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    placeholder="Nhập lại mật khẩu"
                    className={inputClass}
                  />
                </div>
              )}

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                  {isSignup && accountCreated && (
                    <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="mt-2 block font-semibold underline">
                      Đăng nhập bằng tài khoản vừa tạo
                    </Link>
                  )}
                </p>
              )}
              {success && (
                <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                  <Link
                    href={returnTo}
                    className="mt-2 block font-semibold underline"
                  >
                    Tiếp tục mua sắm
                  </Link>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting || Boolean(success) || (isSignup && accountCreated)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-5 font-medium text-white transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Đang xử lý..."
                  : isSignup
                    ? "Tạo tài khoản"
                    : "Đăng nhập"}{" "}
                <ArrowRight size={18} />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {isSignup ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
              <Link
                href={`${isSignup ? "/login" : "/signup"}?next=${encodeURIComponent(returnTo)}`}
                className="font-semibold text-black underline underline-offset-4"
              >
                {isSignup ? "Đăng nhập" : "Đăng ký"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
