// src/app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { API_URL } from "@/lib/constants";

export default function RegisterPage() {
  const router  = useRouter();
  const [form, setForm]           = useState({ email: "", full_name: "", password: "" });
  const [error, setError]         = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(form),
      });

      if (res.status === 409) {
        setError("Email already in use.");
        return;
      }
      if (!res.ok) throw new Error("Registration failed.");

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <p className="text-sm text-slate-500 mt-1">Get started with MiniERP</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={form.full_name}
            onChange={set("full_name")}
            required
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            required
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            Password
          </label>
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            required
            minLength={8}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-xs text-slate-400 mt-1">Minimum 8 characters</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-700 disabled:opacity-40 transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}