"use client";

import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";

export function useApi<T>(url: string) {
  const [attempt, setAttempt] = useState(0);
  const key = `${url}:${attempt}`;
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>({ key: "" });
  useEffect(() => {
    // Abort và kiểm tra signal để response cũ không ghi đè khi URL thay đổi nhanh.
    const controller = new AbortController();
    api.get<T>(url, { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setState({ key, data });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ key, error: apiErrorMessage(error) });
    });
    return () => controller.abort();
  }, [url, key]);
  const current = state.key === key ? state : undefined;
  return { data: current?.data, error: current?.error,
    loading: !current, retry: () => setAttempt((value) => value + 1) };
}
