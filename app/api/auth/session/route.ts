import { NextRequest, NextResponse } from "next/server";
import { FirebaseAdminConfigError, getAdminAuth } from "@/lib/firebase/admin";
import { syncFirebaseUser, UserProfileError } from "@/lib/users";
import {
  getSessionUser,
  isInvalidFirebaseToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sessionCookieOptions,
} from "@/lib/firebase/session";

export const runtime = "nodejs";

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function sameOrigin(request: NextRequest) {
  // POST/DELETE từ website khác không được tạo hoặc xóa phiên của người dùng.
  return request.headers.get("origin") === request.nextUrl.origin;
}

function serverError(error: unknown) {
  if (error instanceof UserProfileError) {
    return json({ error: error.message, code: error.code }, error.status);
  }
  return error instanceof FirebaseAdminConfigError
    ? json({ error: "Server chưa được cấu hình Firebase Admin." }, 503)
    : json({ error: "Không thể xử lý phiên đăng nhập. Vui lòng thử lại." }, 500);
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "Yêu cầu không hợp lệ." }, 403);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return json({ error: "Yêu cầu phải dùng JSON." }, 415);
  }

  let idToken: string;
  try {
    // Giới hạn cả dữ liệu thực nhận, kể cả khi request không có Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Thiếu dữ liệu đăng nhập." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 16384) {
          await reader.cancel();
          return json({ error: "Dữ liệu quá lớn." }, 413);
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || !("idToken" in body)
      || typeof body.idToken !== "string" || !body.idToken || body.idToken.length > 10000) {
      return json({ error: "Thiếu token đăng nhập hợp lệ." }, 400);
    }
    idToken = body.idToken;
  } catch {
    return json({ error: "Dữ liệu đăng nhập không hợp lệ." }, 400);
  }

  try {
    const adminAuth = getAdminAuth();
    const claims = await adminAuth.verifyIdToken(idToken, true);
    // Chỉ đổi token sang cookie khi người dùng vừa đăng nhập trong vòng 5 phút.
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(claims.auth_time) || now - claims.auth_time > 300 || claims.auth_time > now + 30) {
      return json({ error: "Vui lòng đăng nhập lại để tạo phiên." }, 401);
    }
    // Chỉ cấp cookie sau khi hồ sơ đã được đồng bộ và trạng thái tài khoản được kiểm tra.
    const profile = await syncFirebaseUser(claims);
    const session = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE * 1000 });
    // Role lấy từ PostgreSQL, không nhận quyền admin từ form hoặc email tự khai.
    const response = json({ success: true, role: profile.role });
    response.cookies.set(SESSION_COOKIE, session, { ...sessionCookieOptions, maxAge: SESSION_MAX_AGE });
    return response;
  } catch (error) {
    if (isInvalidFirebaseToken(error)) return json({ error: "Phiên đăng nhập không hợp lệ." }, 401);
    return serverError(error);
  }
}

export async function GET() {
  try {
    const user = await getSessionUser();
    return json({ user }, user ? 200 : 401);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "Yêu cầu không hợp lệ." }, 403);
  // Đăng xuất thiết bị hiện tại; không thu hồi các phiên trên thiết bị khác.
  const response = json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
