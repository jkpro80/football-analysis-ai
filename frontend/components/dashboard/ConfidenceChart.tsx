"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Prediction = {
  confidence: {
    label: string;
  };
};

type Props = {
  predictions: Prediction[];
};

type ChartItem = {
  name: string;
  value: number;
};

function getConfidenceLabel(label: string): string {
  const labels: Record<string, string> = {
    very_high: "عالية جدًا",
    high: "عالية",
    medium: "متوسطة",
    low: "منخفضة",
  };

  return labels[label] ?? label;
}

export default function ConfidenceChart({
  predictions,
}: Props) {
  const counters: Record<string, number> = {
    very_high: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const prediction of predictions) {
    const label = prediction.confidence.label;

    counters[label] = (counters[label] ?? 0) + 1;
  }

  const chartData: ChartItem[] = Object.entries(counters)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name: getConfidenceLabel(name),
      value,
    }));

  if (chartData.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-xl font-bold text-white">
          توزيع مستويات الثقة
        </h2>

        <p className="mt-4 text-sm text-slate-400">
          لا توجد بيانات متاحة للرسم.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <h2 className="text-xl font-bold text-white">
        توزيع مستويات الثقة
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        توزيع التوقعات حسب مستوى ثقة النموذج.
      </p>

      <div className="mt-5 h-72">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={65}
              outerRadius={100}
              paddingAngle={3}
            >
              {chartData.map((item) => (
                <Cell
                  key={item.name}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value) => [
                `${value}`,
                "عدد التوقعات",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {chartData.map((item) => (
          <div
            key={item.name}
            className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
          >
            <p className="text-xs text-slate-500">
              {item.name}
            </p>

            <p className="mt-1 text-lg font-bold text-white">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}