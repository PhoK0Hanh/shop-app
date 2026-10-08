// Chỉ quay về đường dẫn nội bộ và tránh vòng lặp trở lại trang xác thực.
export function getAuthReturnTo(value: string | string[] | undefined): string {
  if (typeof value !== "string" || !value.startsWith("/") || /[\\\s]/.test(value)) {
    return "/";
  }
  try {
    const base = "https://shop.internal";
    const url = new URL(value, base);
    if (url.origin !== base || /^\/(login|signup)(\/|$)/i.test(url.pathname)) {
      return "/";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
