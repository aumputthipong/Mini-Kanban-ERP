// components/layout/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { API_URL } from "@/lib/constants";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await fetch(`${API_URL}/auth/logout`, {
      method:      "POST",
      credentials: "include",
    });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors"
    >
      {isLoading
        ? <Loader2 size={15} className="animate-spin" />
        : <LogOut size={15} />
      }
      Sign out
    </button>
  );
}