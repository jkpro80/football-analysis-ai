"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Match = {
  id: number;
  home_team_id: number;
  away_team_id: number;
  date: string;
  status: string;
  home_team: string;
  away_team: string;
};

type MatchesManagerProps = {
  initialMatches: Match[];
};

const API_URL = "http://127.0.0.1:8000";

function translateStatus(status: string) {
  const statuses: Record<string, string> = {
    scheduled: "مجدولة",
    live: "مباشرة",
    finished: "منتهية",
    postponed: "مؤجلة",
    cancelled: "ملغاة",
  };

  return statuses[status] ?? status;
}

function getStatusStyle(status: string) {
  const styles: Record<
    string,
    {
      backgroundColor: string;
      color: string;
    }
  > = {
    scheduled: {
      backgroundColor: "#dbeafe",
      color: "#1d4ed8",
    },
    live: {
      backgroundColor: "#fee2e2",
      color: "#b91c1c",
    },
    finished: {
      backgroundColor: "#dcfce7",
      color: "#15803d",
    },
    postponed: {
      backgroundColor: "#fef3c7",
      color: "#b45309",
    },
    cancelled: {
      backgroundColor: "#e2e8f0",
      color: "#475569",
    },
  };

  return (
    styles[status] ?? {
      backgroundColor: "#e2e8f0",
      color: "#0f172a",
    }
  );
}

export default function MatchesManager({
  initialMatches,
}: MatchesManagerProps) {
  const [matches, setMatches] =
    useState<Match[]>(initialMatches);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [deletingMatchId, setDeletingMatchId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredMatches = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return matches.filter((match) => {
      const matchesSearch =
        search === "" ||
        match.home_team.toLowerCase().includes(search) ||
        match.away_team.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        match.status === statusFilter;

      const matchesDate =
        dateFilter === "" ||
        match.date === dateFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    matches,
    searchTerm,
    statusFilter,
    dateFilter,
  ]);

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("");
  }

  async function deleteMatch(match: Match) {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف مباراة ${match.home_team} ضد ${match.away_team}؟`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingMatchId(match.id);

    try {
      const response = await fetch(
        `${API_URL}/matches/${match.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        let message = "تعذر حذف المباراة";

        try {
          const result = await response.json();

          if (typeof result.detail === "string") {
            message = result.detail;
          }
        } catch {
          // الاستجابة ليست JSON.
        }

        throw new Error(message);
      }

      setMatches((currentMatches) =>
        currentMatches.filter(
          (currentMatch) =>
            currentMatch.id !== match.id
        )
      );

      setSuccess(
        `تم حذف مباراة ${match.home_team} ضد ${match.away_team} بنجاح.`
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "حدث خطأ غير متوقع أثناء الحذف"
      );
    } finally {
      setDeletingMatchId(null);
    }
  }

  return (
    <div>
      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      {success && (
        <div style={successStyle}>
          {success}
        </div>
      )}

      <section style={filtersSectionStyle}>
        <div style={filtersGridStyle}>
          <div>
            <label
              htmlFor="match-search"
              style={labelStyle}
            >
              البحث عن فريق
            </label>

            <input
              id="match-search"
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="مثال: Arsenal"
              style={fieldStyle}
            />
          </div>

          <div>
            <label
              htmlFor="status-filter"
              style={labelStyle}
            >
              حالة المباراة
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              style={fieldStyle}
            >
              <option value="all">
                جميع الحالات
              </option>
              <option value="scheduled">
                مجدولة
              </option>
              <option value="live">
                مباشرة
              </option>
              <option value="finished">
                منتهية
              </option>
              <option value="postponed">
                مؤجلة
              </option>
              <option value="cancelled">
                ملغاة
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="date-filter"
              style={labelStyle}
            >
              تاريخ المباراة
            </label>

            <input
              id="date-filter"
              type="date"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value)
              }
              style={fieldStyle}
            />
          </div>
        </div>

        <div style={filtersFooterStyle}>
          <p
            style={{
              margin: 0,
              color: "#64748b",
            }}
          >
            عدد النتائج:{" "}
            <strong>
              {filteredMatches.length}
            </strong>
          </p>

          <button
            type="button"
            onClick={clearFilters}
            style={clearButtonStyle}
          >
            مسح الفلاتر
          </button>
        </div>
      </section>

      {filteredMatches.length === 0 ? (
        <div style={emptyStyle}>
          لا توجد مباريات تطابق البحث.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          {filteredMatches.map((match) => {
            const statusStyle =
              getStatusStyle(match.status);

            return (
              <article
                key={match.id}
                style={matchCardStyle}
              >
                <div style={matchHeaderStyle}>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        color: "#64748b",
                        fontSize: "14px",
                      }}
                    >
                      {match.date}
                    </p>

                    <h2
                      style={{
                        margin: "10px 0 0",
                        fontSize: "24px",
                        fontWeight: 900,
                      }}
                    >
                      {match.home_team}
                      {"  "}

                      <span
                        style={{
                          color: "#10b981",
                        }}
                      >
                        VS
                      </span>

                      {"  "}
                      {match.away_team}
                    </h2>
                  </div>

                  <span
                    style={{
                      padding: "8px 14px",
                      borderRadius: "999px",
                      backgroundColor:
                        statusStyle.backgroundColor,
                      color: statusStyle.color,
                      fontWeight: 700,
                    }}
                  >
                    {translateStatus(match.status)}
                  </span>
                </div>

                <div style={actionsStyle}>
                  <Link
                    href={`/matches/${match.id}`}
                    style={secondaryLinkStyle}
                  >
                    عرض التحليل
                  </Link>

                  <Link
                    href={`/predictions/${match.id}`}
                    style={predictionLinkStyle}
                  >
                    التوقع الكامل
                  </Link>

                  <Link
                    href={`/admin/matches/${match.id}/edit`}
                    style={editLinkStyle}
                  >
                    تعديل
                  </Link>

                  <button
                    type="button"
                    disabled={
                      deletingMatchId === match.id
                    }
                    onClick={() =>
                      deleteMatch(match)
                    }
                    style={{
                      ...deleteButtonStyle,
                      backgroundColor:
                        deletingMatchId === match.id
                          ? "#94a3b8"
                          : "#dc2626",
                      cursor:
                        deletingMatchId === match.id
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {deletingMatchId === match.id
                      ? "جارٍ الحذف..."
                      : "حذف"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

const fieldStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #94a3b8",
  borderRadius: "10px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  fontSize: "16px",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 700,
};

const errorStyle = {
  marginBottom: "18px",
  padding: "14px",
  border: "1px solid #ef4444",
  borderRadius: "12px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  fontWeight: 700,
};

const successStyle = {
  marginBottom: "18px",
  padding: "14px",
  border: "1px solid #10b981",
  borderRadius: "12px",
  backgroundColor: "#dcfce7",
  color: "#166534",
  fontWeight: 700,
};

const filtersSectionStyle = {
  marginBottom: "24px",
  padding: "20px",
  border: "1px solid #cbd5e1",
  borderRadius: "18px",
};

const filtersGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const filtersFooterStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
  flexWrap: "wrap" as const,
  marginTop: "18px",
};

const clearButtonStyle = {
  padding: "9px 14px",
  border: "1px solid #94a3b8",
  borderRadius: "9px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer",
};

const emptyStyle = {
  padding: "30px",
  border: "1px solid #cbd5e1",
  borderRadius: "18px",
  textAlign: "center" as const,
};

const matchCardStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: "20px",
  padding: "22px",
};

const matchHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap" as const,
};

const actionsStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "20px",
  flexWrap: "wrap" as const,
};

const secondaryLinkStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "1px solid #94a3b8",
  textDecoration: "none",
  color: "inherit",
  fontWeight: 700,
};

const predictionLinkStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  backgroundColor: "#10b981",
  textDecoration: "none",
  color: "#052e16",
  fontWeight: 800,
};

const editLinkStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 800,
};

const deleteButtonStyle = {
  padding: "10px 16px",
  border: "none",
  borderRadius: "10px",
  color: "#ffffff",
  fontWeight: 800,
};