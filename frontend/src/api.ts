export type ApiError = {
  status: number;
  code?: string;
  message?: string;
};

// 生产环境使用环境变量配置的 API 地址，开发环境使用相对路径（通过 Vite 代理）
const API_BASE = import.meta.env.VITE_API_URL || "";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = API_BASE + path;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    credentials: "include",
    ...options,
  });

  if (response.ok) {
    if (response.status === 204) {
      return {} as T;
    }
    return (await response.json()) as T;
  }

  let body: any = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  const error: ApiError = {
    status: response.status,
    code: body?.code,
    message: body?.message,
  };
  throw error;
}
