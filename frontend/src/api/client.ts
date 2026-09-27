/** API 客户端：统一 baseURL、Bearer Token、错误与 401 处理。 */

const TOKEN_KEY = "gm_token";

export const UNAUTHORIZED_EVENT = "gm:unauthorized";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* 忽略存储异常 */
  }
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

/** 开发态走 Vite 代理；如需直连后端可设置 VITE_API_BASE */
const BASE_URL = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "网络连接失败，请检查后端服务是否已启动");
  }

  if (response.status === 401) {
    setToken(null);
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    throw new ApiError(401, "登录已失效，请重新登录");
  }

  if (!response.ok) {
    let detail = `请求失败（${response.status}）`;
    try {
      const data = (await response.json()) as { detail?: unknown };
      if (typeof data.detail === "string") detail = data.detail;
      else if (Array.isArray(data.detail) && data.detail.length) {
        const first = data.detail[0] as { msg?: string };
        if (first?.msg) detail = first.msg;
      }
    } catch {
      /* 保留默认文案 */
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}