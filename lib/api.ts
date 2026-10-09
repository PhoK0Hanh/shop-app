import axios from "axios";

// URL tương đối giữ cookie trên cùng website, không cần hard-code host khi deploy.
export const api = axios.create({ baseURL: "/api", timeout: 15000 });

export function apiErrorMessage(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404
    ? "Không tìm thấy sản phẩm."
    : "Không tải được dữ liệu. Vui lòng thử lại.";
}
