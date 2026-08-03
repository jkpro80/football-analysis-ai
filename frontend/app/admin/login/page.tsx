"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  success: boolean;
  message: string;
};

export default function AdminLoginPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!password.trim()) {
      setMessage("يرجى إدخال كلمة المرور.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.success) {
        setMessage(
          data.message || "تعذر تسجيل الدخول.",
        );
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      console.error("Login request failed:", error);
      setMessage("تعذر الاتصال بالخادم.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        backgroundColor: "#f8fafc",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "32px",
          borderRadius: "22px",
          border: "1px solid #cbd5e1",
          backgroundColor: "#ffffff",
          boxShadow: "0 16px 45px rgba(15, 23, 42, 0.08)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#0f766e",
            fontWeight: 800,
          }}
        >
          Football Analysis AI
        </p>

        <h1
          style={{
            margin: "10px 0 8px",
            fontSize: "32px",
          }}
        >
          تسجيل دخول الإدارة
        </h1>

        <p
          style={{
            margin: "0 0 24px",
            color: "#64748b",
            lineHeight: 1.7,
          }}
        >
          أدخل كلمة مرور المسؤول للوصول إلى لوحة التحكم.
        </p>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 800,
            }}
          >
            كلمة المرور
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            autoComplete="current-password"
            disabled={isLoading}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              borderRadius: "11px",
              border: "1px solid #94a3b8",
              fontSize: "16px",
              outline: "none",
            }}
          />

          {message ? (
            <p
              role="alert"
              style={{
                margin: "14px 0 0",
                padding: "11px 13px",
                borderRadius: "10px",
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                fontWeight: 700,
              }}
            >
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "13px 16px",
              border: 0,
              borderRadius: "11px",
              backgroundColor: isLoading
                ? "#94a3b8"
                : "#0f766e",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 800,
              cursor: isLoading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {isLoading
              ? "جارٍ تسجيل الدخول..."
              : "دخول لوحة الإدارة"}
          </button>
        </form>
      </section>
    </main>
  );
}