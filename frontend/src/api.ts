export type ApiError = {
  status: number;
  code?: string;
  message?: string;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(path, {
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
