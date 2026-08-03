import type {
  DashboardFixture,
  QuickFilter,
} from "./types";

export const QUICK_FILTERS: Array<{
  key: QuickFilter;
  label: string;
}> = [
  { key: "all", label: "جميع المباريات" },
  { key: "today", label: "اليوم" },
  { key: "tomorrow", label: "غدًا" },
  { key: "week", label: "هذا الأسبوع" },
  { key: "high-confidence", label: "ثقة مرتفعة" },
  { key: "over25", label: "أكثر من 2.5" },
  { key: "btts", label: "تسجيل الفريقين" },
  { key: "home-win", label: "فوز المضيف" },
  { key: "away-win", label: "فوز الضيف" },
];

export function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function normalizeDate(value?: string) {
  if (!value) return null;

  const normalizedValue = value.includes(" ")
    ? value.replace(" ", "T")
    : value;

  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value?: string) {
  const date = normalizeDate(value);

  if (!date) {
    return value ?? "الموعد غير محدد";
  }

  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function translateStatus(status?: string) {
  const statuses: Record<string, string> = {
    scheduled: "مجدولة",
    live: "مباشرة",
    finished: "منتهية",
    postponed: "مؤجلة",
    cancelled: "ملغاة",
  };

  if (!status) return "غير محددة";
  return statuses[status.toLowerCase()] ?? status;
}

export function statusClasses(status?: string) {
  switch (status?.toLowerCase()) {
    case "live":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "finished":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "scheduled":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
    default:
      return "border-slate-700 bg-slate-800/40 text-slate-300";
  }
}

export function confidenceClasses(score?: number) {
  const value = score ?? 0;

  if (value >= 75) return "text-emerald-300";
  if (value >= 55) return "text-amber-300";
  return "text-red-300";
}

export function confidenceLabel(score?: number) {
  const value = score ?? 0;

  if (value >= 75) return "مرتفعة";
  if (value >= 55) return "متوسطة";
  return "منخفضة";
}

export function translatePick(
  fixture: DashboardFixture,
) {
  const pick = fixture.bestPick;

  if (!pick) return "غير متوفر";

  const labels: Record<string, string> = {
    home_win: `فوز ${fixture.homeTeam.name}`,
    away_win: `فوز ${fixture.awayTeam.name}`,
    draw: "التعادل",
    over_2_5: "أكثر من 2.5 هدف",
    under_2_5: "أقل من 2.5 هدف",
    btts: "تسجيل الفريقين",
    no_btts: "عدم تسجيل الفريقين",
  };

  return labels[pick.key] ?? pick.label;
}

export function matchesQuickFilter(
  fixture: DashboardFixture,
  filter: QuickFilter,
) {
  if (filter === "all") return true;

  const fixtureDate = normalizeDate(fixture.date);
  const now = new Date();

  if (filter === "today") {
    return fixtureDate
      ? isSameDay(fixtureDate, now)
      : false;
  }

  if (filter === "tomorrow") {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    return fixtureDate
      ? isSameDay(fixtureDate, tomorrow)
      : false;
  }

  if (filter === "week") {
    if (!fixtureDate) return false;

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    end.setHours(23, 59, 59, 999);

    return fixtureDate >= start && fixtureDate <= end;
  }

  if (filter === "high-confidence") {
    return (fixture.confidence?.score ?? 0) >= 75;
  }

  if (filter === "over25") {
    return (fixture.probabilities?.over25 ?? 0) >= 50;
  }

  if (filter === "btts") {
    return (fixture.probabilities?.btts ?? 0) >= 50;
  }

  if (filter === "home-win") {
    return fixture.bestPick?.key === "home_win";
  }

  if (filter === "away-win") {
    return fixture.bestPick?.key === "away_win";
  }

  return true;
}
