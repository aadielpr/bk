import type { ApiError, ApiSuccessResponse } from "@bk/shared";
import type { AuthUser } from "@bk/shared";

const TOKEN_KEY = "bk_token";
const USER_KEY = "bk_user";

export function getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    return token;
}

export function getStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function storeSession(token: string, user: AuthUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export async function apiResponse<T>(
    path: string,
    init: RequestInit = {},
): Promise<ApiSuccessResponse<T>> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string> | undefined),
    };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(path, { ...init, headers });
    const body = (await res.json().catch(() => null)) as ApiError | ApiSuccessResponse<T> | null;

    if (!res.ok) {
        if (res.status === 401) clearSession();
        throw new Error(body?.message ?? "Terjadi kesalahan");
    }
    return body as ApiSuccessResponse<T>;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await apiResponse<T>(path, init);
    return response.data;
}
