import Link from "next/link";

type Prediction = {
  match_id: number;
  home_team: string;
  away_team: string;
  date: string;
  status: string;
  model: string;

  expected_goals: {
    home: number;
    away: number;
    total: number;
  };

  probabilities: {
    home_win: number;
    draw: number;
    away_win: number;
  };

  over_under: {
    over_0_5: number;
    under_0_5: number;
    over_1_5: number;
    under_1_5: number;
    over_2_5: number;
    under_2_5: number;
    over_3_5: number;
    under_3_5: number;
    over_4_5: number;
    under_4_5: number;
  };

  btts: {
    yes: number;
    no: number;
  };

  double_chance: {
    home_or_draw: number;
    away_or_draw: number;
    home_or_away: number;
  };

  clean_sheets: {
    home: number;
    away: number;
  };

  likely_scores: Array<{
    score: string;
    probability: number;
  }>;

  best_pick: {
    key: string;
    label: string;
    probability: number;
    rating: number;
  };

  confidence: string;
  confidence_score: number;

  analysis: string[];

  calibration?: {
    enabled: boolean;
    sample_size: number;
    before: {
      home: number;
      away: number;
      total: number;
    };
    after: {
      home: number;
      away: number;
      total: number;
    };
  };
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

async function getPrediction(
  matchId: string,
): Promise<Prediction | null> {
  try {
    const response = await fetch(
  `${API_URL}/predictions/v32/${matchId}`,
  {
    cache: "no-store",
  },
);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Prediction;
  } catch {
    return null;
  }
}

function formatPercent(
  value: number,
): string {
  return `${value.toFixed(1)}%`;
}

function translateConfidence(
  value: string,
): string {
  const labels: Record<string, string> = {
    low: "منخفضة",
    medium: "متوسطة",
    high: "مرتفعة",
  };

  return labels[value] ?? value;
}

function translateStatus(
  value: string,
): string {
  const labels: Record<string, string> = {
    scheduled: "مجدولة",
    live: "مباشرة",
    finished: "منتهية",
    postponed: "مؤجلة",
    cancelled: "ملغاة",
  };

  return labels[value] ?? value;
}

export default async function PredictionPage({
  params,
}: PageProps) {
  const { id } = await params;

  const prediction = await getPrediction(id);

  if (!prediction) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background:
            "linear-gradient(180deg, #020617, #0f172a)",
          color: "#f8fafc",
        }}
      >
        <section
          style={{
            maxWidth: "700px",
            width: "100%",
            padding: "38px",
            borderRadius: "24px",
            border: "1px solid #334155",
            backgroundColor: "#0f172a",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
            }}
          >
            تعذر تحميل التوقع
          </h1>

          <p
            style={{
              marginTop: "14px",
              color: "#94a3b8",
            }}
          >
            تأكد من تشغيل خادم Backend.
          </p>

          <Link
            href="/"
            style={{
              display: "inline-block",
              marginTop: "22px",
              padding: "12px 20px",
              borderRadius: "12px",
              backgroundColor: "#34d399",
              color: "#052e16",
              textDecoration: "none",
              fontWeight: 900,
            }}
          >
            العودة إلى الرئيسية
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: "32px 18px",
        background:
          "linear-gradient(180deg, #020617, #0f172a)",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#34d399",
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            ← العودة إلى المباريات
          </Link>

          <Link
            href={`/matches/${prediction.match_id}`}
            style={{
              color: "#cbd5e1",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            عرض التحليل التفصيلي
          </Link>
        </div>

        <section
          style={{
            padding: "28px",
            borderRadius: "28px",
            border: "1px solid #1e293b",
            backgroundColor:
              "rgba(15, 23, 42, 0.92)",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: "#34d399",
                  fontWeight: 900,
                }}
              >
                {prediction.model}
              </p>

              <h1
                style={{
                  margin: "10px 0 0",
                  fontSize: "34px",
                  fontWeight: 950,
                }}
              >
                التوقع الكامل
              </h1>
            </div>

            <span
              style={{
                padding: "9px 15px",
                borderRadius: "999px",
                backgroundColor: "#1e293b",
                fontWeight: 800,
              }}
            >
              {translateStatus(
                prediction.status,
              )}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr auto 1fr",
              gap: "18px",
              alignItems: "center",
              marginTop: "34px",
            }}
          >
            <TeamBox
              name={prediction.home_team}
              label="صاحب الأرض"
            />

            <div
              style={{
                padding: "13px 16px",
                borderRadius: "14px",
                backgroundColor: "#020617",
                color: "#34d399",
                fontSize: "20px",
                fontWeight: 950,
              }}
            >
              VS
            </div>

            <TeamBox
              name={prediction.away_team}
              label="الفريق الضيف"
            />
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "16px",
            marginBottom: "22px",
          }}
        >
          <HighlightCard
            title="أفضل اختيار"
            value={prediction.best_pick.label}
            subtitle={`${formatPercent(
              prediction.best_pick.probability,
            )} — ${prediction.best_pick.rating}/5`}
          />

          <HighlightCard
            title="الثقة"
            value={`${prediction.confidence_score}%`}
            subtitle={translateConfidence(
              prediction.confidence,
            )}
          />

          <HighlightCard
            title="الأهداف المتوقعة"
            value={prediction.expected_goals.total.toFixed(
              2,
            )}
            subtitle={`${prediction.expected_goals.home.toFixed(
              2,
            )} - ${prediction.expected_goals.away.toFixed(
              2,
            )}`}
          />

          <HighlightCard
            title="المعايرة"
            value={
              prediction.calibration?.enabled
                ? "مفعّلة"
                : "غير مفعّلة"
            }
            subtitle={
              prediction.calibration
                ? `${prediction.calibration.sample_size} مباراة`
                : "لا توجد بيانات"
            }
          />
        </section>

        <Section title="احتمالات النتيجة">
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
            }}
          >
            <ProbabilityCard
              title={`فوز ${prediction.home_team}`}
              value={
                prediction.probabilities
                  .home_win
              }
            />

            <ProbabilityCard
              title="التعادل"
              value={
                prediction.probabilities.draw
              }
            />

            <ProbabilityCard
              title={`فوز ${prediction.away_team}`}
              value={
                prediction.probabilities
                  .away_win
              }
            />
          </div>
        </Section>

        <Section title="الأسواق الأساسية">
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "12px",
            }}
          >
            <MarketCard
              title="أكثر من 1.5"
              value={
                prediction.over_under
                  .over_1_5
              }
            />

            <MarketCard
              title="أكثر من 2.5"
              value={
                prediction.over_under
                  .over_2_5
              }
            />

            <MarketCard
              title="أقل من 2.5"
              value={
                prediction.over_under
                  .under_2_5
              }
            />

            <MarketCard
              title="أقل من 3.5"
              value={
                prediction.over_under
                  .under_3_5
              }
            />

            <MarketCard
              title="يسجل الفريقان"
              value={prediction.btts.yes}
            />

            <MarketCard
              title="لا يسجل الفريقان"
              value={prediction.btts.no}
            />

            <MarketCard
              title="1X"
              value={
                prediction.double_chance
                  .home_or_draw
              }
            />

            <MarketCard
              title="X2"
              value={
                prediction.double_chance
                  .away_or_draw
              }
            />
          </div>
        </Section>

        <Section title="النتائج الأكثر احتمالًا">
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
            }}
          >
            {prediction.likely_scores.map(
              (item) => (
                <article
                  key={item.score}
                  style={{
                    padding: "20px",
                    borderRadius: "16px",
                    border:
                      "1px solid #1e293b",
                    backgroundColor: "#020617",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "30px",
                      fontWeight: 950,
                    }}
                  >
                    {item.score}
                  </p>

                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#34d399",
                      fontWeight: 900,
                    }}
                  >
                    {formatPercent(
                      item.probability,
                    )}
                  </p>
                </article>
              ),
            )}
          </div>
        </Section>

        <Section title="الشباك النظيفة">
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
            }}
          >
            <ProbabilityCard
              title={prediction.home_team}
              value={
                prediction.clean_sheets.home
              }
            />

            <ProbabilityCard
              title={prediction.away_team}
              value={
                prediction.clean_sheets.away
              }
            />
          </div>
        </Section>

        <Section title="تحليل مختصر">
          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {prediction.analysis.map(
              (item, index) => (
                <div
                  key={`${item}-${index}`}
                  style={{
                    padding: "15px 17px",
                    borderRadius: "14px",
                    border:
                      "1px solid #1e293b",
                    backgroundColor: "#020617",
                    lineHeight: 1.8,
                  }}
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </Section>

        {prediction.calibration ? (
          <Section title="مقارنة قبل وبعد المعايرة">
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "14px",
              }}
            >
              <MetricCard
                title="xG قبل المعايرة"
                value={prediction.calibration.before.total.toFixed(
                  2,
                )}
              />

              <MetricCard
                title="xG بعد المعايرة"
                value={prediction.calibration.after.total.toFixed(
                  2,
                )}
              />

              <MetricCard
                title="أهداف الأرض قبل"
                value={prediction.calibration.before.home.toFixed(
                  2,
                )}
              />

              <MetricCard
                title="أهداف الأرض بعد"
                value={prediction.calibration.after.home.toFixed(
                  2,
                )}
              />

              <MetricCard
                title="أهداف الخارج قبل"
                value={prediction.calibration.before.away.toFixed(
                  2,
                )}
              />

              <MetricCard
                title="أهداف الخارج بعد"
                value={prediction.calibration.after.away.toFixed(
                  2,
                )}
              />
            </div>
          </Section>
        ) : null}
      </div>
    </main>
  );
}

function TeamBox({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#94a3b8",
          fontSize: "13px",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: "9px 0 0",
          fontSize: "26px",
          fontWeight: 950,
        }}
      >
        {name}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        padding: "22px",
        borderRadius: "24px",
        border: "1px solid #1e293b",
        backgroundColor:
          "rgba(15, 23, 42, 0.9)",
        marginBottom: "22px",
      }}
    >
      <h2
        style={{
          margin: "0 0 18px",
          fontSize: "23px",
          fontWeight: 900,
        }}
      >
        {title}
      </h2>

      {children}
    </section>
  );
}

function HighlightCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <article
      style={{
        padding: "20px",
        borderRadius: "18px",
        border: "1px solid #1e293b",
        backgroundColor:
          "rgba(15, 23, 42, 0.9)",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#94a3b8",
        }}
      >
        {title}
      </p>

      <p
        style={{
          margin: "11px 0 0",
          fontSize: "24px",
          fontWeight: 950,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </p>

      <p
        style={{
          margin: "8px 0 0",
          color: "#34d399",
          fontWeight: 800,
          fontSize: "13px",
        }}
      >
        {subtitle}
      </p>
    </article>
  );
}

function ProbabilityCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <article
      style={{
        padding: "18px",
        borderRadius: "16px",
        border: "1px solid #1e293b",
        backgroundColor: "#020617",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#94a3b8",
        }}
      >
        {title}
      </p>

      <p
        style={{
          margin: "10px 0 0",
          fontSize: "28px",
          fontWeight: 950,
          color: "#34d399",
        }}
      >
        {formatPercent(value)}
      </p>

      <div
        style={{
          height: "8px",
          marginTop: "12px",
          borderRadius: "999px",
          overflow: "hidden",
          backgroundColor: "#1e293b",
        }}
      >
        <div
          style={{
            width: `${Math.min(
              value,
              100,
            )}%`,
            height: "100%",
            backgroundColor: "#34d399",
          }}
        />
      </div>
    </article>
  );
}

function MarketCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <article
      style={{
        padding: "17px",
        borderRadius: "15px",
        border: "1px solid #1e293b",
        backgroundColor: "#020617",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#94a3b8",
          fontSize: "14px",
        }}
      >
        {title}
      </p>

      <p
        style={{
          margin: "9px 0 0",
          fontSize: "24px",
          fontWeight: 950,
        }}
      >
        {formatPercent(value)}
      </p>
    </article>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <article
      style={{
        padding: "18px",
        borderRadius: "15px",
        border: "1px solid #1e293b",
        backgroundColor: "#020617",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#94a3b8",
        }}
      >
        {title}
      </p>

      <p
        style={{
          margin: "10px 0 0",
          fontSize: "26px",
          fontWeight: 950,
        }}
      >
        {value}
      </p>
    </article>
  );
}