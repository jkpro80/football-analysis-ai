"use client";

import { FormEvent, useEffect, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

type OperationState = {
  status: Status;
  message: string;
  data?: unknown;
};

type SystemStatus = {
  status?: string;
  backend?: string;
  database?: string;
  prediction_engine?: string;
};

const initialState: OperationState = {
  status: "idle",
  message: "",
};

async function requestApi(
  path: string,
  method: "GET" | "POST" = "POST",
): Promise<unknown> {
  const response = await fetch(`/api/admin/backend${path}`, {
    method,
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail =
      typeof data === "object" &&
      data !== null &&
      "detail" in data
        ? String((data as { detail: unknown }).detail)
        : String(data);

    throw new Error(detail || `HTTP ${response.status}`);
  }

  return data;
}

function Result({
  state,
}: {
  state: OperationState;
}) {
  if (state.status === "idle") {
    return null;
  }

  const colors: Record<Status, string> = {
    idle: "#64748b",
    loading: "#b45309",
    success: "#15803d",
    error: "#b91c1c",
  };

  return (
    <div
      style={{
        marginTop: "14px",
        padding: "12px",
        borderRadius: "12px",
        backgroundColor: "#f8fafc",
        border: `1px solid ${colors[state.status]}33`,
      }}
    >
      <strong style={{ color: colors[state.status] }}>
        {state.message}
      </strong>

      {state.data !== undefined && (
        <pre
          style={{
            margin: "10px 0 0",
            maxHeight: "260px",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            fontSize: "12px",
            direction: "ltr",
            textAlign: "left",
            backgroundColor: "#0f172a",
            color: "#f8fafc",
            padding: "14px",
            borderRadius: "10px",
            lineHeight: 1.7,
          }}
        >
          {JSON.stringify(state.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function StatusBadge({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: "14px",
        padding: "14px",
        backgroundColor: "#ffffff",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#64748b",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        {label}
      </p>

      <strong
        style={{
          display: "block",
          marginTop: "8px",
          color: ok ? "#15803d" : "#b91c1c",
        }}
      >
        {ok ? "🟢" : "🔴"} {value}
      </strong>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: "18px",
        padding: "20px",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: "28px" }}>{icon}</span>

        <div>
          <h3 style={{ margin: 0, fontSize: "19px" }}>
            {title}
          </h3>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              lineHeight: 1.7,
              fontSize: "14px",
            }}
          >
            {description}
          </p>
        </div>
      </div>

      <div style={{ marginTop: "16px" }}>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  padding: "11px 16px",
  border: 0,
  borderRadius: "10px",
  backgroundColor: "#0f766e",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  width: "100%",
  padding: "14px 18px",
  backgroundColor: "#2563eb",
  fontSize: "16px",
};

export default function DataManagementPanel() {
  const [systemStatus, setSystemStatus] =
    useState<SystemStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const [teamId, setTeamId] = useState("");
  const [fixtureId, setFixtureId] = useState("");
  const [predictionLimit, setPredictionLimit] = useState("50");

  const [allTeamIds, setAllTeamIds] = useState("");
  const [startDate, setStartDate] = useState("2026-07-22");
  const [endDate, setEndDate] = useState("2026-08-31");

  const [updateAllState, setUpdateAllState] =
    useState<OperationState>(initialState);
  const [teamsState, setTeamsState] =
    useState<OperationState>(initialState);
  const [fixturesState, setFixturesState] =
    useState<OperationState>(initialState);
  const [statisticsState, setStatisticsState] =
    useState<OperationState>(initialState);
  const [fixtureStatisticsState, setFixtureStatisticsState] =
    useState<OperationState>(initialState);
  const [eloState, setEloState] =
    useState<OperationState>(initialState);
  const [predictionState, setPredictionState] =
    useState<OperationState>(initialState);

  async function loadSystemStatus() {
    setStatusLoading(true);

    try {
      const data = await requestApi("/system/status", "GET");
      setSystemStatus(data as SystemStatus);
    } catch {
      setSystemStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }

  useEffect(() => {
    void loadSystemStatus();

    const interval = window.setInterval(() => {
      void loadSystemStatus();
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  async function run(
    setter: React.Dispatch<
      React.SetStateAction<OperationState>
    >,
    successMessage: string,
    task: () => Promise<unknown>,
  ) {
    setter({
      status: "loading",
      message: "جارٍ تنفيذ العملية...",
    });

    try {
      const data = await task();

      setter({
        status: "success",
        message: successMessage,
        data,
      });

      void loadSystemStatus();
    } catch (error) {
      setter({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير معروف.",
      });
    }
  }

  function requireTeamId(
    setter: React.Dispatch<
      React.SetStateAction<OperationState>
    >,
  ): string | null {
    const value = teamId.trim();

    if (!value) {
      setter({
        status: "error",
        message: "أدخل Sportmonks Team ID أولًا.",
      });

      return null;
    }

    return value;
  }

  function updateEverything(event: FormEvent) {
    event.preventDefault();

    if (!allTeamIds.trim()) {
      setUpdateAllState({
        status: "error",
        message:
          "أدخل Sportmonks Team IDs مفصولة بفواصل.",
      });
      return;
    }

    const query = new URLSearchParams({
      team_ids: allTeamIds.trim(),
      start_date: startDate,
      end_date: endDate,
      statistics_limit: "20",
      elo_limit: "500",
      prediction_limit: "100",
      recent_limit: "5",
      replace_existing_predictions: "false",
    });

    void run(
      setUpdateAllState,
      "اكتمل تحديث النظام.",
      () =>
        requestApi(
          `/system/update-all?${query.toString()}`,
        ),
    );
  }

  function syncTeam(event: FormEvent) {
    event.preventDefault();

    const value = requireTeamId(setTeamsState);

    if (!value) {
      return;
    }

    const query = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });

    void run(
      setTeamsState,
      "تمت مزامنة الفريق ومبارياته.",
      () =>
        requestApi(
          `/sync/team/${value}?${query.toString()}`,
        ),
    );
  }

  function loadFixtures() {
    const value = requireTeamId(setFixturesState);

    if (!value) {
      return;
    }

    void run(
      setFixturesState,
      "تم تحميل مباريات الفريق من Sportmonks.",
      () =>
        requestApi(
          `/sportmonks/teams/${value}/fixtures`,
          "GET",
        ),
    );
  }

  function syncTeamStatistics() {
    const value = requireTeamId(setStatisticsState);

    if (!value) {
      return;
    }

    void run(
      setStatisticsState,
      "تم تحديث إحصائيات الفريق.",
      () =>
        requestApi(
          `/sync/team/${value}/statistics?limit=20`,
        ),
    );
  }

  function syncFixtureStatistics() {
    const value = fixtureId.trim();

    if (!value) {
      setFixtureStatisticsState({
        status: "error",
        message:
          "أدخل Sportmonks Fixture ID أولًا.",
      });
      return;
    }

    void run(
      setFixtureStatisticsState,
      "تم تحديث إحصائيات المباراة.",
      () =>
        requestApi(
          `/sync/fixture/${value}/statistics`,
        ),
    );
  }

  function updateElo() {
    void run(
      setEloState,
      "تم تطبيق تحديثات ELO.",
      () => requestApi("/elo/apply-pending?limit=500"),
    );
  }

  function generatePredictions() {
    const parsedLimit = Number(predictionLimit);
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(parsedLimit, 500))
      : 50;

    const query = new URLSearchParams({
      limit: String(safeLimit),
      recent_limit: "5",
      replace_existing: "false",
    });

    void run(
      setPredictionState,
      "اكتمل توليد توقعات V5.",
      () =>
        requestApi(
          `/predictions-v5/generate-all?${query.toString()}`,
        ),
    );
  }

  const backendOnline =
    systemStatus?.backend === "online";
  const databaseConnected =
    systemStatus?.database === "connected";

  return (
    <section
      style={{
        marginBottom: "28px",
        border: "1px solid #cbd5e1",
        borderRadius: "20px",
        padding: "24px",
        background:
          "linear-gradient(135deg, #f8fafc, #ecfdf5)",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <p
          style={{
            margin: 0,
            color: "#0f766e",
            fontWeight: 900,
          }}
        >
          SYSTEM CONTROL CENTER
        </p>

        <h2
          style={{
            margin: "6px 0 0",
            fontSize: "28px",
          }}
        >
          مركز التحكم بالنظام
        </h2>

        <p
          style={{
            margin: "8px 0 0",
            color: "#64748b",
          }}
        >
          راقب حالة النظام ونفّذ التحديث الكامل أو
          العمليات المنفردة من مكان واحد.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <StatusBadge
          label="Backend"
          value={
            statusLoading
              ? "Checking..."
              : backendOnline
                ? "Online"
                : "Offline"
          }
          ok={backendOnline}
        />

        <StatusBadge
          label="Database"
          value={
            statusLoading
              ? "Checking..."
              : databaseConnected
                ? "Connected"
                : "Disconnected"
          }
          ok={databaseConnected}
        />

        <StatusBadge
          label="Prediction Engine"
          value={
            systemStatus?.prediction_engine ??
            "Unavailable"
          }
          ok={Boolean(systemStatus?.prediction_engine)}
        />
      </div>

      <div
        style={{
          border: "1px solid #93c5fd",
          borderRadius: "18px",
          padding: "20px",
          backgroundColor: "#eff6ff",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "22px" }}>
          🚀 Sync Everything
        </h3>

        <p
          style={{
            margin: "8px 0 16px",
            color: "#475569",
          }}
        >
          مزامنة الفرق والمباريات، تحديث الإحصائيات
          وELO، ثم توليد توقعات V5.
        </p>

        <form
          onSubmit={updateEverything}
          style={{ display: "grid", gap: "12px" }}
        >
          <input
            value={allTeamIds}
            onChange={(event) =>
              setAllTeamIds(event.target.value)
            }
            placeholder="Sportmonks Team IDs — مثال: 2447,939,625"
            style={inputStyle}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            <label style={{ fontWeight: 700 }}>
              من تاريخ
              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                style={{
                  ...inputStyle,
                  marginTop: "7px",
                }}
              />
            </label>

            <label style={{ fontWeight: 700 }}>
              إلى تاريخ
              <input
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                style={{
                  ...inputStyle,
                  marginTop: "7px",
                }}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={
              updateAllState.status === "loading"
            }
            style={primaryButtonStyle}
          >
            {updateAllState.status === "loading"
              ? "جارٍ تحديث النظام..."
              : "🚀 تشغيل التحديث الكامل"}
          </button>
        </form>

        <Result state={updateAllState} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        <ActionCard
          icon="🔄"
          title="Sync Team"
          description="حفظ فريق من Sportmonks مع مبارياته ضمن الفترة المحددة."
        >
          <form
            onSubmit={syncTeam}
            style={{ display: "grid", gap: "10px" }}
          >
            <input
              value={teamId}
              onChange={(event) =>
                setTeamId(event.target.value)
              }
              placeholder="Sportmonks Team ID"
              inputMode="numeric"
              style={inputStyle}
            />

            <button
              type="submit"
              disabled={teamsState.status === "loading"}
              style={buttonStyle}
            >
              مزامنة الفريق
            </button>
          </form>

          <Result state={teamsState} />
        </ActionCard>

        <ActionCard
          icon="🗓️"
          title="Sync Fixtures"
          description="عرض مباريات الفريق المتاحة من Sportmonks."
        >
          <button
            type="button"
            onClick={loadFixtures}
            disabled={fixturesState.status === "loading"}
            style={buttonStyle}
          >
            تحميل مباريات الفريق
          </button>

          <Result state={fixturesState} />
        </ActionCard>

        <ActionCard
          icon="📊"
          title="Update Team Statistics"
          description="تحديث آخر إحصائيات الفريق المحدد."
        >
          <button
            type="button"
            onClick={syncTeamStatistics}
            disabled={
              statisticsState.status === "loading"
            }
            style={buttonStyle}
          >
            تحديث إحصائيات الفريق
          </button>

          <Result state={statisticsState} />
        </ActionCard>

        <ActionCard
          icon="📈"
          title="Update Fixture Statistics"
          description="تحديث إحصائيات مباراة باستخدام Sportmonks Fixture ID."
        >
          <div style={{ display: "grid", gap: "10px" }}>
            <input
              value={fixtureId}
              onChange={(event) =>
                setFixtureId(event.target.value)
              }
              placeholder="Sportmonks Fixture ID"
              inputMode="numeric"
              style={inputStyle}
            />

            <button
              type="button"
              onClick={syncFixtureStatistics}
              disabled={
                fixtureStatisticsState.status ===
                "loading"
              }
              style={buttonStyle}
            >
              تحديث إحصائيات المباراة
            </button>
          </div>

          <Result state={fixtureStatisticsState} />
        </ActionCard>

        <ActionCard
          icon="⭐"
          title="Update ELO Ratings"
          description="تطبيق تحديثات ELO على المباريات المكتملة غير المعالجة."
        >
          <button
            type="button"
            onClick={updateElo}
            disabled={eloState.status === "loading"}
            style={buttonStyle}
          >
            تحديث ELO
          </button>

          <Result state={eloState} />
        </ActionCard>

        <ActionCard
          icon="🤖"
          title="Generate Predictions V5"
          description="توليد وحفظ توقعات المباريات المجدولة تلقائيًا."
        >
          <div style={{ display: "grid", gap: "10px" }}>
            <input
              type="number"
              min={1}
              max={500}
              value={predictionLimit}
              onChange={(event) =>
                setPredictionLimit(event.target.value)
              }
              style={inputStyle}
            />

            <button
              type="button"
              onClick={generatePredictions}
              disabled={
                predictionState.status === "loading"
              }
              style={buttonStyle}
            >
              توليد جميع التوقعات
            </button>
          </div>

          <Result state={predictionState} />
        </ActionCard>
      </div>
    </section>
  );
}