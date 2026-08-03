type StatusItem = {
  label: string;
  value: number;
  color: string;
};

type MatchStatusChartProps = {
  scheduled: number;
  live: number;
  finished: number;
  postponed: number;
  cancelled: number;
};

export default function MatchStatusChart({
  scheduled,
  live,
  finished,
  postponed,
  cancelled,
}: MatchStatusChartProps) {
  const items: StatusItem[] = [
    {
      label: "مجدولة",
      value: scheduled,
      color: "#2563eb",
    },
    {
      label: "مباشرة",
      value: live,
      color: "#ef4444",
    },
    {
      label: "منتهية",
      value: finished,
      color: "#10b981",
    },
    {
      label: "مؤجلة",
      value: postponed,
      color: "#f59e0b",
    },
    {
      label: "ملغاة",
      value: cancelled,
      color: "#64748b",
    },
  ];

  const highestValue = Math.max(
    ...items.map((item) => item.value),
    1
  );

  return (
    <section
      dir="rtl"
      style={{
        marginTop: "30px",
        padding: "26px",
        border: "1px solid #94a3b8",
        borderRadius: "20px",
        backgroundColor: "#ffffff",
        forcedColorAdjust: "none",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "28px",
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        توزيع حالات المباريات
      </h2>

      <p
        style={{
          margin: "8px 0 26px",
          color: "#64748b",
        }}
      >
        مقارنة عدد المباريات حسب حالتها الحالية
      </p>

      <div
        style={{
          display: "grid",
          gap: "24px",
        }}
      >
        {items.map((item) => {
          const percentage =
  item.value === 0
    ? 0
    : (item.value / highestValue) * 100;

          return (
            <div
              key={item.label}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "100px minmax(0, 1fr) 50px",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <strong
                style={{
                  color: "#0f172a",
                  fontSize: "16px",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </strong>

              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "20px",
                  border: "1px solid #64748b",
                  borderRadius: "999px",
                  backgroundColor: "#e2e8f0",
                  overflow: "hidden",
                  forcedColorAdjust: "none",
                }}
              >
                {item.value > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                      boxShadow: `inset 0 0 0 1000px ${item.color}`,
                      borderRadius: "999px",
                      forcedColorAdjust: "none",
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  />
                )}
              </div>

              <span
                style={{
                  padding: "5px 10px",
                  borderRadius: "999px",
                  backgroundColor: item.color,
                  boxShadow: `inset 0 0 0 1000px ${item.color}`,
                  color: "#ffffff",
                  textAlign: "center",
                  fontWeight: 800,
                  forcedColorAdjust: "none",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
              >
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}