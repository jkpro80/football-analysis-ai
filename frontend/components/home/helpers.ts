import type { Locale } from "@/lib/i18n/config";

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

export function normalizeStatus(
  status?: string,
): "scheduled" | "live" | "finished" | "other" {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();

  if (
    [
      "1",
      "2",
      "ns",
      "scheduled",
      "not_started",
      "pending",
    ].includes(normalized)
  ) {
    return "scheduled";
  }

  if (
    [
      "3",
      "4",
      "live",
      "inplay",
      "in-play",
      "halftime",
      "ht",
    ].includes(normalized)
  ) {
    return "live";
  }

  if (
    [
      "5",
      "8",
      "9",
      "10",
      "finished",
      "completed",
      "ft",
    ].includes(normalized)
  ) {
    return "finished";
  }

  return "other";
}

export function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function normalizeDate(value?: string) {
  if (!value) return null;

  const normalizedValue = value.includes(" ")
    ? value.replace(" ", "T")
    : value;

  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function dateLocale(locale: Locale): string {
  if (locale === "ar") return "ar-IQ";
  if (locale === "sv") return "sv-SE";

  return "en-GB";
}

function unavailableDateText(locale: Locale): string {
  if (locale === "ar") {
    return "الموعد غير محدد";
  }

  if (locale === "sv") {
    return "Tid ej angiven";
  }

  return "Date not specified";
}

export function formatDate(
  value?: string,
  locale: Locale = "ar",
) {
  const date = normalizeDate(value);

  if (!date) {
    return value ?? unavailableDateText(locale);
  }

  return new Intl.DateTimeFormat(
    dateLocale(locale),
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

export function isSameDay(
  first: Date,
  second: Date,
) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function statusTexts(locale: Locale) {
  if (locale === "ar") {
    return {
      scheduled: "مجدولة",
      live: "مباشرة",
      finished: "منتهية",
      postponed: "مؤجلة",
      cancelled: "ملغاة",
      unknown: "غير محددة",
    };
  }

  if (locale === "sv") {
    return {
      scheduled: "Schemalagd",
      live: "Live",
      finished: "Avslutad",
      postponed: "Uppskjuten",
      cancelled: "Inställd",
      unknown: "Okänd",
    };
  }

  return {
    scheduled: "Scheduled",
    live: "Live",
    finished: "Finished",
    postponed: "Postponed",
    cancelled: "Cancelled",
    unknown: "Unknown",
  };
}

export function translateStatus(
  status?: string,
  locale: Locale = "ar",
) {
  const texts = statusTexts(locale);

  if (!status) {
    return texts.unknown;
  }

  const rawStatus = status
    .trim()
    .toLowerCase();

  if (
    rawStatus === "postponed" ||
    rawStatus === "6"
  ) {
    return texts.postponed;
  }

  if (
    rawStatus === "cancelled" ||
    rawStatus === "canceled" ||
    rawStatus === "7"
  ) {
    return texts.cancelled;
  }

  const normalized = normalizeStatus(status);

  if (normalized === "scheduled") {
    return texts.scheduled;
  }

  if (normalized === "live") {
    return texts.live;
  }

  if (normalized === "finished") {
    return texts.finished;
  }

  return status;
}

export function statusClasses(status?: string) {
  switch (normalizeStatus(status)) {
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

export function confidenceClasses(
  score?: number,
) {
  const value = score ?? 0;

  if (value >= 75) {
    return "text-emerald-300";
  }

  if (value >= 55) {
    return "text-amber-300";
  }

  return "text-red-300";
}

export function confidenceLabel(
  score?: number,
  locale: Locale = "ar",
) {
  const value = score ?? 0;

  if (locale === "sv") {
    if (value >= 75) return "Hög";
    if (value >= 55) return "Medel";

    return "Låg";
  }

  if (locale === "en") {
    if (value >= 75) return "High";
    if (value >= 55) return "Medium";

    return "Low";
  }

  if (value >= 75) return "مرتفعة";
  if (value >= 55) return "متوسطة";

  return "منخفضة";
}

export function translatePick(
  fixture: DashboardFixture,
  locale: Locale = "ar",
) {
  const pick = fixture.bestPick;

  if (!pick) {
    if (locale === "sv") {
      return "Inte tillgängligt";
    }

    if (locale === "en") {
      return "Not available";
    }

    return "غير متوفر";
  }

  if (locale === "sv") {
    const labels: Record<string, string> = {
      home_win:
        `Vinst för ${fixture.homeTeam.name}`,
      away_win:
        `Vinst för ${fixture.awayTeam.name}`,
      draw: "Oavgjort",
      over_2_5: "Över 2,5 mål",
      under_2_5: "Under 2,5 mål",
      btts: "Båda lagen gör mål",
      no_btts:
        "Båda lagen gör inte mål",
    };

    return labels[pick.key] ?? pick.label;
  }

  if (locale === "en") {
    const labels: Record<string, string> = {
      home_win:
        `${fixture.homeTeam.name} Win`,
      away_win:
        `${fixture.awayTeam.name} Win`,
      draw: "Draw",
      over_2_5: "Over 2.5 Goals",
      under_2_5: "Under 2.5 Goals",
      btts: "Both Teams to Score",
      no_btts:
        "Both Teams Not to Score",
    };

    return labels[pick.key] ?? pick.label;
  }

  const labels: Record<string, string> = {
    home_win:
      `فوز ${fixture.homeTeam.name}`,
    away_win:
      `فوز ${fixture.awayTeam.name}`,
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
  if (filter === "all") {
    return true;
  }

  const fixtureDate =
    normalizeDate(fixture.date);

  const now = new Date();

  if (filter === "today") {
    return fixtureDate
      ? isSameDay(fixtureDate, now)
      : false;
  }

  if (filter === "tomorrow") {
    const tomorrow = new Date(now);

    tomorrow.setDate(
      now.getDate() + 1,
    );

    return fixtureDate
      ? isSameDay(fixtureDate, tomorrow)
      : false;
  }

  if (filter === "week") {
    if (!fixtureDate) {
      return false;
    }

    const start = new Date(now);

    start.setHours(0, 0, 0, 0);

    const end = new Date(start);

    end.setDate(
      start.getDate() + 7,
    );

    end.setHours(
      23,
      59,
      59,
      999,
    );

    return (
      fixtureDate >= start &&
      fixtureDate <= end
    );
  }

  if (filter === "high-confidence") {
    return (
      fixture.confidence?.score ?? 0
    ) >= 75;
  }

  if (filter === "over25") {
    return (
      fixture.probabilities?.over25 ?? 0
    ) >= 50;
  }

  if (filter === "btts") {
    return (
      fixture.probabilities?.btts ?? 0
    ) >= 50;
  }

  if (filter === "home-win") {
    return (
      fixture.bestPick?.key ===
      "home_win"
    );
  }

  if (filter === "away-win") {
    return (
      fixture.bestPick?.key ===
      "away_win"
    );
  }

  return true;
}
