import { API_URL } from "@/lib/constants";
import { useToastStore } from "@/store/useToastStore";

// กำหนด Type ว่า Options สามารถรับอะไรได้บ้าง (ขยายจาก RequestInit ปกติของ fetch)
interface FetchOptions extends Omit<RequestInit, "body"> {
  data?: unknown; // ใช้รับข้อมูลที่จะส่งไปเป็น JSON body
}

/**
 * ฟังก์ชันหลักสำหรับเรียก API
 * <T> คือ Generic Type ช่วยให้เราระบุได้ว่าข้อมูลที่ return กลับมาหน้าตาเป็นยังไง
 */
export async function apiClient<T = any>(
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
    } catch (e) {
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
  } catch (e) {
    return null as T;
  }
}