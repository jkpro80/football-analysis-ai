"use client";

import { useState } from "react";

type ActionStatus = {
  type: "success" | "error";
  message: string;
} | null;

type ModelAdminActionsProps = {
  calibrationEnabled: boolean;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "/api";

export default function ModelAdminActions({
  calibrationEnabled,
}: ModelAdminActionsProps) {
  const [loadingAction, setLoadingAction] =
    useState<string | null>(null);

  const [status, setStatus] =
    useState<ActionStatus>(null);

  async function runAction(
    action: "tuning" | "disable",
  ) {
    setLoadingAction(action);
    setStatus(null);

    try {
      const endpoint =
        action === "tuning"
          ? "/model/tuning"
          : "/model/disable";

      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
        },
      );

      const responseText =
        await response.text();

      let data: unknown = null;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = responseText;
        }
      }

      if (!response.ok) {
        const detail =
          typeof data === "object" &&
          data !== null &&
          "detail" in data
            ? String(
                (
                  data as {
                    detail: unknown;
                  }
                ).detail,
              )
            : `HTTP ${response.status}`;

        throw new Error(detail);
      }

      setStatus({
        type: "success",
        message:
          action === "tuning"
            ? "تم تحديث معايرة النموذج بنجاح."
            : "تم تعطيل المعايرة بنجاح.",
      });

      window.setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع.",
      });
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <section
      dir="rtl"
      style={{
        padding: "24px",
        marginBottom: "24px",
        borderRadius: "24px",
        border: "1px solid #1e293b",
        backgroundColor:
          "rgba(15, 23, 42, 0.9)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 950,
            }}
          >
            أدوات إدارة النموذج
          </h2>

          <p
            style={{
              margin: "8px 0 0",
              color: "#94a3b8",
              lineHeight: 1.7,
            }}
          >
            تحديث أوزان النموذج وإدارة حالة
            المعايرة.
          </p>
        </div>

        <span
          style={{
            padding: "8px 14px",
            borderRadius: "999px",
            backgroundColor:
              calibrationEnabled
                ? "#064e3b"
                : "#450a0a",
            color: calibrationEnabled
              ? "#6ee7b7"
              : "#fca5a5",
            fontWeight: 900,
          }}
        >
          المعايرة:{" "}
          {calibrationEnabled
            ? "مفعّلة"
            : "متوقفة"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() =>
            runAction("tuning")
          }
          disabled={
            loadingAction !== null
          }
          style={{
            padding: "12px 18px",
            border: "none",
            borderRadius: "12px",
            backgroundColor: "#34d399",
            color: "#052e16",
            fontWeight: 900,
            cursor:
              loadingAction === null
                ? "pointer"
                : "not-allowed",
            opacity:
              loadingAction === null
                ? 1
                : 0.65,
          }}
        >
          {loadingAction === "tuning"
            ? "جاري التحديث..."
            : "تحديث المعايرة"}
        </button>

        <button
          type="button"
          onClick={() =>
            runAction("disable")
          }
          disabled={
            loadingAction !== null ||
            !calibrationEnabled
          }
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            border:
              "1px solid #ef4444",
            backgroundColor:
              "transparent",
            color: "#f87171",
            fontWeight: 900,
            cursor:
              loadingAction === null &&
              calibrationEnabled
                ? "pointer"
                : "not-allowed",
            opacity:
              loadingAction === null &&
              calibrationEnabled
                ? 1
                : 0.5,
          }}
        >
          {loadingAction === "disable"
            ? "جاري التعطيل..."
            : "تعطيل المعايرة"}
        </button>
      </div>

      {status ? (
        <div
          style={{
            marginTop: "18px",
            padding: "13px 15px",
            borderRadius: "12px",
            border:
              status.type === "success"
                ? "1px solid #059669"
                : "1px solid #dc2626",
            backgroundColor:
              status.type === "success"
                ? "#022c22"
                : "#450a0a",
            color:
              status.type === "success"
                ? "#6ee7b7"
                : "#fca5a5",
            fontWeight: 750,
          }}
        >
          {status.message}
        </div>
      ) : null}
    </section>
  );
}