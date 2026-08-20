"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLocale } from "@/context/locale-context";

type MatchItem = {
  id: number;
  sportmonks_id: number | null;
  home_team_id: number;
  away_team_id: number;
  home_team: string;
  away_team: string;
  league_name?: string | null;
  date: string;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
};

type FixturesHeaderProps = {
  matches: MatchItem[];
};

type TeamItem = {
  sportmonks_id?: number | null;
};

type Message = {
  type: "success" | "error" | "info";
  text: string;
} | null;

const BATCH_SIZE = 3;

function apiDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function csvCell(value: unknown) {
  const text =
    value === null || value === undefined
      ? ""
      : String(value);

  return `"${text.replaceAll('"', '""')}"`;
}

function splitIntoBatches<T>(
  values: T[],
  size: number,
) {
  const batches: T[][] = [];

  for (
    let index = 0;
    index < values.length;
    index += size
  ) {
    batches.push(
      values.slice(index, index + size),
    );
  }

  return batches;
}

export default function FixturesHeader({
  matches,
}: FixturesHeaderProps) {
  const router = useRouter();
  const { locale, direction } = useLocale();

  const text =
    locale === "sv"
      ? {
          eyebrow: "MATCHCENTER",
          title: "Matchadministration",
          description:
            "Uppdatera matchdata i omgångar och exportera den aktuella listan till en CSV-fil.",
          home: "Hem",
          exportCsv: "Exportera CSV",
          updating: "Uppdaterar...",
          updateMatches: "Uppdatera matcher",
          total: "Totalt antal matcher",
          upcoming: "Kommande",
          live: "Live",
          finished: "Avslutade",
          preparingTeams: "Förbereder laglistan...",
          loadTeamsError: "Det gick inte att ladda laglistan.",
          noSportMonksIds:
            "Inga giltiga SportMonks-ID:n hittades.",
          updatingBatch: (current: number, total: number) =>
            `Uppdaterar omgång ${current} av ${total}`,
          batchFailed: (batch: number) =>
            `Omgång ${batch} misslyckades.`,
          updateSuccess: (count: number) =>
            `${count} lag uppdaterades.`,
          updatePartial: (succeeded: number, failed: number) =>
            `${succeeded} lag uppdaterades, ${failed} misslyckades.`,
          updateError:
            "Ett fel uppstod under uppdateringen.",
          noMatchesExport:
            "Det finns inga matcher att exportera.",
          exportSuccess: (count: number) =>
            `${count} matcher exporterades.`,
          csvColumns: [
            "Match-ID",
            "SportMonks ID",
            "Liga",
            "Hemmalag",
            "Bortalag",
            "Datum",
            "Status",
            "Hemmamål",
            "Bortamål",
          ],
        }
      : locale === "en"
        ? {
            eyebrow: "FIXTURES CONTROL CENTER",
            title: "Fixtures Management",
            description:
              "Update fixture data in batches and export the current list to a CSV file.",
            home: "Home",
            exportCsv: "Export CSV",
            updating: "Updating...",
            updateMatches: "Update Fixtures",
            total: "Total Fixtures",
            upcoming: "Upcoming",
            live: "Live",
            finished: "Finished",
            preparingTeams: "Preparing team list...",
            loadTeamsError: "Unable to load the team list.",
            noSportMonksIds:
              "No valid SportMonks IDs were found.",
            updatingBatch: (current: number, total: number) =>
              `Updating batch ${current} of ${total}`,
            batchFailed: (batch: number) =>
              `Batch ${batch} failed.`,
            updateSuccess: (count: number) =>
              `${count} teams updated successfully.`,
            updatePartial: (succeeded: number, failed: number) =>
              `${succeeded} teams updated, ${failed} failed.`,
            updateError:
              "An error occurred during the update.",
            noMatchesExport:
              "There are no fixtures to export.",
            exportSuccess: (count: number) =>
              `${count} fixtures exported.`,
            csvColumns: [
              "Match ID",
              "SportMonks ID",
              "League",
              "Home Team",
              "Away Team",
              "Date",
              "Status",
              "Home Goals",
              "Away Goals",
            ],
          }
        : {
            eyebrow: "مركز إدارة المباريات",
            title: "إدارة المباريات",
            description:
              "تحديث بيانات المباريات على دفعات وتصدير القائمة الحالية إلى ملف CSV.",
            home: "الرئيسية",
            exportCsv: "تصدير CSV",
            updating: "جاري التحديث...",
            updateMatches: "تحديث المباريات",
            total: "إجمالي المباريات",
            upcoming: "قادمة",
            live: "مباشرة",
            finished: "منتهية",
            preparingTeams: "جاري تجهيز قائمة الفرق...",
            loadTeamsError: "تعذر تحميل قائمة الفرق.",
            noSportMonksIds:
              "لم يتم العثور على معرفات SportMonks صالحة.",
            updatingBatch: (current: number, total: number) =>
              `جاري تحديث الدفعة ${current} من ${total}`,
            batchFailed: (batch: number) =>
              `فشلت الدفعة ${batch}.`,
            updateSuccess: (count: number) =>
              `تم تحديث ${count} فريق بنجاح.`,
            updatePartial: (succeeded: number, failed: number) =>
              `تم تحديث ${succeeded} فريق، وفشل تحديث ${failed} فريق.`,
            updateError:
              "حدث خطأ أثناء عملية التحديث.",
            noMatchesExport:
              "لا توجد مباريات لتصديرها.",
            exportSuccess: (count: number) =>
              `تم تصدير ${count} مباراة.`,
            csvColumns: [
              "رقم المباراة",
              "SportMonks ID",
              "الدوري",
              "الفريق المضيف",
              "الفريق الضيف",
              "التاريخ",
              "الحالة",
              "أهداف المضيف",
              "أهداف الضيف",
            ],
          };

  const [updating, setUpdating] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [message, setMessage] =
    useState<Message>(null);

  const statistics = useMemo(() => {
    const finished = matches.filter((match) => {
      const status =
        match.status?.toLowerCase() ?? "";

      return (
        status.includes("finished") ||
        status.includes("complete") ||
        status.includes("ended")
      );
    }).length;

    const live = matches.filter((match) => {
      const status =
        match.status?.toLowerCase() ?? "";

      return (
        status.includes("live") ||
        status.includes("inplay")
      );
    }).length;

    return {
      total: matches.length,
      finished,
      live,
      upcoming:
        matches.length - finished - live,
    };
  }, [matches]);

  async function updateMatches() {
    if (updating) {
      return;
    }

    setUpdating(true);
    setProgress(0);
    setMessage({
      type: "info",
      text: text.preparingTeams,
    });

    try {
      const teamsResponse = await fetch(
        "/api/teams",
        {
          cache: "no-store",
        },
      );

      if (!teamsResponse.ok) {
        throw new Error(
          text.loadTeamsError,
        );
      }

      const teams =
        (await teamsResponse.json()) as TeamItem[];

      const teamIds = Array.from(
        new Set(
          teams
            .map((team) =>
              Number(team.sportmonks_id),
            )
            .filter(
              (id) =>
                Number.isInteger(id) &&
                id > 0,
            ),
        ),
      );

      if (teamIds.length === 0) {
        throw new Error(
          "لم يتم العثور على معرفات SportMonks صالحة.",
        );
      }

      const start = new Date();
      start.setDate(start.getDate() - 7);

      const end = new Date();
      end.setDate(end.getDate() + 14);

      const batches = splitIntoBatches(
        teamIds,
        BATCH_SIZE,
      );

      let succeeded = 0;
      let failed = 0;

      for (
        let index = 0;
        index < batches.length;
        index += 1
      ) {
        setMessage({
          type: "info",
          text:
            `جاري تحديث الدفعة ${index + 1}` +
            ` من ${batches.length}`,
        });

        const response = await fetch(
          "/system-update",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action: "sync",
              teamIds: batches[index],
              startDate: apiDate(start),
              endDate: apiDate(end),
            }),
          },
        );

        const result = (await response.json()) as {
          succeeded?: number;
          failed?: number;
          detail?: string;
        };

        if (!response.ok) {
          throw new Error(
            result.detail ??
              text.batchFailed(index + 1),
          );
        }

        succeeded +=
          Number(result.succeeded) || 0;

        failed +=
          Number(result.failed) || 0;

        setProgress(
          Math.round(
            ((index + 1) /
              batches.length) *
              100,
          ),
        );
      }

      setMessage({
        type:
          failed === 0
            ? "success"
            : "info",
        text:
          failed === 0
            ? text.updateSuccess(succeeded)
            : (
                `تم تحديث ${succeeded} فريق، ` +
                `وفشل تحديث ${failed} فريق.`
              ),
      });

      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء عملية التحديث.",
      });
    } finally {
      setUpdating(false);
    }
  }

  function exportMatches() {
    if (matches.length === 0) {
      setMessage({
        type: "error",
        text: "لا توجد مباريات لتصديرها.",
      });

      return;
    }

    const columns = text.csvColumns;

    const rows = matches.map((match) => [
      match.id,
      match.sportmonks_id ?? "",
      match.league_name ?? "",
      match.home_team,
      match.away_team,
      match.date,
      match.status ?? "",
      match.home_score ?? "",
      match.away_score ?? "",
    ]);

    const csv = [
      columns.map(csvCell).join(","),
      ...rows.map((row) =>
        row.map(csvCell).join(","),
      ),
    ].join("\r\n");

    const blob = new Blob(
      ["\uFEFF", csv],
      {
        type: "text/csv;charset=utf-8",
      },
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `fixtures-${apiDate(new Date())}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    setMessage({
      type: "success",
      text:
        text.exportSuccess(matches.length),
    });
  }

  const messageClass =
    message?.type === "success"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
      : message?.type === "error"
        ? "border-red-500/20 bg-red-500/10 text-red-200"
        : "border-cyan-500/20 bg-cyan-500/10 text-cyan-200";

  return (
    <section dir={direction} className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/75 shadow-xl shadow-black/20">
      <div className="p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold text-cyan-400">
              {text.eyebrow}
            </p>

            <h1 className="text-3xl font-black text-white sm:text-4xl">
              {text.title}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              {text.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-700 bg-slate-950/50 px-5 py-2.5 font-bold text-slate-200 transition hover:bg-slate-800"
            >
              {text.home}
            </Link>

            <button
              type="button"
              onClick={exportMatches}
              className="rounded-xl border border-slate-700 bg-slate-950/50 px-5 py-2.5 font-bold text-slate-200 transition hover:bg-slate-800"
            >
              {text.exportCsv}
            </button>

            <button
              type="button"
              onClick={updateMatches}
              disabled={updating}
              className="rounded-xl bg-cyan-500 px-5 py-2.5 font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-60"
            >
              {updating
                ? text.updating
                : text.updateMatches}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-slate-800 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [text.total, statistics.total],
          [text.upcoming, statistics.upcoming],
          [text.live, statistics.live],
          [text.finished, statistics.finished],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="bg-slate-950/45 px-6 py-4"
          >
            <p className="text-xs font-bold text-slate-500">
              {label}
            </p>

            <p className="mt-2 text-2xl font-black text-white">
              {value}
            </p>
          </div>
        ))}
      </div>

      {(updating || message) && (
        <div className="border-t border-slate-800 p-5">
          {updating && (
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          )}

          {message && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm font-bold ${messageClass}`}
            >
              {message.text}

              {updating && (
                <span
                  dir="ltr"
                  className="mr-2"
                >
                  {progress}%
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}








