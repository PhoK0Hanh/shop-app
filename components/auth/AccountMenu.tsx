"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleUser, LogOut } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { getAuthReturnTo } from "@/lib/auth-redirect";
import { clearServerSession, SessionRequestError } from "@/lib/firebase/session-client";

type Account = { name: string; email: string };
const buttonClass =
  "flex size-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100 disabled:cursor-wait disabled:opacity-50";

export default function AccountMenu({ onOpen }: { onOpen: () => void }) {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const logoutPending = useRef(false);

  useEffect(() => {
    // Chờ Firebase khôi phục phiên; bỏ listener khi component bị tháo khỏi trang.
    return onAuthStateChanged(auth, (user) => {
      setAccount(user ? {
        name: user.displayName?.trim() || user.email || "Tài khoản",
        email: user.email || "",
      } : null);
      setLoading(false);
      setOpen(false);
      setError("");
    }, () => {
      setLoading(false);
      setError("Không thể kiểm tra phiên đăng nhập. Vui lòng tải lại trang.");
    });
  }, []);

  useEffect(() => {
    // Đóng menu bằng Escape hoặc khi bấm bên ngoài, dùng được trên PC và mobile.
    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        container.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    }
    if (!open) return;
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    if (logoutPending.current) return;
    logoutPending.current = true;
    setSigningOut(true);
    setError("");
    try {
      // Xóa cookie trước; nếu API lỗi vẫn giữ tài khoản để người dùng có thể thử lại.
      await clearServerSession();
      await signOut(auth);
      setOpen(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof SessionRequestError ? error.message : "Chưa thể đăng xuất. Vui lòng thử lại.");
    } finally {
      logoutPending.current = false;
      setSigningOut(false);
    }
  }

  return (
    <div ref={container} className="relative">
      {loading ? (
        <button type="button" disabled title="Đang kiểm tra đăng nhập" className={buttonClass}>
          <CircleUser size={22} />
        </button>
      ) : account ? (
        <button type="button" title={account.name} className={buttonClass}
          onClick={() => { onOpen(); setOpen((current) => !current); }}>
          <CircleUser size={22} />
        </button>
      ) : (
        <Link href="/login" title="Đăng nhập" onClick={onOpen} className={buttonClass}
          onNavigate={(event) => {
            event.preventDefault();
            // Giữ nguyên trang cần quay về khi mở form đăng nhập từ navbar.
            const { pathname, search, hash } = window.location;
            const next = /^\/(login|signup)(\/|$)/.test(pathname)
              ? new URLSearchParams(search).get("next") ?? undefined
              : `${pathname}${search}${hash}`;
            router.push(`/login?next=${encodeURIComponent(getAuthReturnTo(next))}`);
          }}>
          <CircleUser size={22} />
        </Link>
      )}
      {open && account && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
          <p className="break-words text-sm font-semibold">{account.name}</p>
          {account.email && <p className="mt-1 break-all text-xs text-gray-500">{account.email}</p>}
          <button type="button" onClick={handleSignOut} disabled={signingOut}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-100 disabled:cursor-wait disabled:opacity-50">
            <LogOut size={18} />
            {signingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}
      {error && !account && (
        <p className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-red-100 bg-white p-3 text-sm text-red-600 shadow-lg">{error}</p>
      )}
    </div>
  );
}
