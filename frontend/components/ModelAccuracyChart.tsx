type AccuracyItem = {
  label: string;
  value: number;
};

type ModelAccuracyChartProps = {
  matchResult: number;
  over25: number;
  btts: number;
  exactScore: number;
};

function normalizeValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(value, 100),
  );
}

export default function ModelAccuracyChart({
  matchResult,
  over25,
  btts,
  exactScore,
}: ModelAccuracyChartProps) {
  const items: AccuracyItem[] = [
    {
      label: "نتيجة المباراة 1X2",
      value: normalizeValue(matchResult),
    },
    {
      label: "أكثر أو أقل من 2.5",
      value: normalizeValue(over25),
    },
    {
      label: "تسجيل الفريقين BTTS",
      value: normalizeValue(btts),
    },
    {
      label: "النتيجة الدقيقة",
      value: normalizeValue(exactScore),
    },
  ];

  return (
    <section
      dir="rtl"
      style={{
        padding: "24px",
        borderRadius: "24px",
        border: "1px solid #1e293b",
        backgroundColor:
          "rgba(15, 23, 42, 0.9)",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          marginBottom: "22px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: 950,
          }}
        >
          أداء النموذج
        </h2>

        <p
          style={{
            margin: "8px 0 0",
            color: "#94a3b8",
            lineHeight: 1.7,
          }}
        >
          مقارنة نسب الدقة الحالية لنموذج
          التوقع في الأسواق المختلفة.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "20px",
        }}
      >
        {items.map((item) => (
          <article
            key={item.label}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "16px",
                marginBottom: "9px",
              }}
            >
              <span
                style={{
                  color: "#cbd5e1",
                  fontWeight: 750,
                }}
              >
                {item.label}
              </span>

              <strong
                style={{
                  color: "#34d399",
                  fontSize: "17px",
                }}
              >
                {item.value.toFixed(1)}%
              </strong>
            </div>

            <div
              style={{
                position: "relative",
                height: "14px",
                borderRadius: "999px",
                overflow: "hidden",
                backgroundColor: "#020617",
                border:
                  "1px solid #1e293b",
              }}
            >
              <div
                style={{
                  width: `${item.value}%`,
                  height: "100%",
                  borderRadius: "999px",
                  background:
                    "linear-gradient(90deg, #059669, #34d399)",
                  transition:
                    "width 500ms ease",
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}