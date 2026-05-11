import { API_URL } from "@/lib/constants";
import { useToastStore } from "@/store/useToastStore";

/**
 * Same as fetch's RequestInit but with an opinionated `data` field that gets
 * JSON-stringified into the body. Use `data` for any non-GET request — it
 * also flips the default method to POST when set.
 */
interface FetchOptions extends Omit<RequestInit, "body"> {
  data?: unknown;
}

/**
 * Single entry point for all backend HTTP calls.
 *
 * Conventions baked in:
 *  - `credentials: "include"` so the auth_token HttpOnly cookie rides along.
 *  - JSON content-type set automatically; `data` is stringified into body.
 *  - Method defaults to POST when `data` is given, GET otherwise. Override
 *    with `method: "PATCH" | "DELETE"` etc.
 *  - 401 → redirects to /login. 403 → toast (single source of permission UX).
 *
 * @typeParam T  Expected response shape — set this to make the call site
 *               type-checked without an explicit cast.
 * @param endpoint  Path appended to `NEXT_PUBLIC_API_URL` (e.g. "/boards").
 * @param options   `data` for body; everything else mirrors fetch's RequestInit.
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  { data, ...customConfig }: FetchOptions = {}
): Promise<T> {
  
  // 1. จัดเตรียม Headers พื้นฐาน (บังคับส่ง JSON)
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customConfig.headers, // ถ้ามีการส่ง Header อื่นมา ให้เอามาทับหรือเพิ่มเข้าไป
  };

  // 2. จัดเตรียม Config พื้นฐาน
  const config: RequestInit = {
    method: data ? "POST" : "GET", // ฉลาดพอที่จะรู้ว่า ถ้ามี data ส่งมา แปลว่าเป็น POST (แต่เรา override เป็น PATCH/PUT ได้)
    ...customConfig,
    headers,
    credentials: "include", 
  };

  if (data) {
    config.body = JSON.stringify(data);
  }


  const response = await fetch(`${API_URL}${endpoint}`, config);


  if (!response.ok) {
    let errorMessage = "Something went wrong";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    if (response.status === 403) {
      useToastStore.getState().show({
        message: errorMessage || "You don't have permission to perform this action",
        duration: 5000,
      });
    }
    throw new Error(errorMessage);
  }

  //  จัดการกรณี 204 No Content (เช่น การ Delete สำเร็จ จะไม่มีข้อมูลตอบกลับมา)
  if (response.status === 204) {
    return null as T;
  }

  //  แกะ JSON ออกมาเป็น Object พร้อมใช้งาน
  try {
    return await response.json();
  } catch {
    return null as T;
  }
}