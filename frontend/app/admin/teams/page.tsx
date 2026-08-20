"use client";

import Link from "next/link";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Team = {
  id: number;
  sportmonks_id: number | null;
  name: string;
  country: string | null;
  attack: number;
  defense: number;
  midfield: number;
  elo: number;
  home_advantage: number;
  goals_scored?: number;
  goals_conceded?: number;
};

type EditableTeam = Team & {
  isEditing: boolean;
  original: Team;
};

type Message =
  | {
      type: "success" | "error";
      text: string;
    }
  | null;

type NumberField =
  | "attack"
  | "defense"
  | "midfield"
  | "elo"
  | "home_advantage";

const API_URL = "/api/admin/backend";

export default function TeamsPage() {
  const [teams, setTeams] = useState<EditableTeam[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingTeamId, setSavingTeamId] =
    useState<number | null>(null);
  const [message, setMessage] = useState<Message>(null);

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${API_URL}/teams?limit=1000`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const detail = await getErrorMessage(
          response,
          "تعذر تحميل الفرق.",
        );

        throw new Error(detail);
      }

      const result = (await response.json()) as Team[];

      /*
       * إخفاء البيانات التجريبية التي أضيفت من Swagger،
       * مثل الفريق الذي اسمه string ودولته string.
       */
      const validTeams = result.filter((team) => {
        const normalizedName = team.name
          .trim()
          .toLowerCase();

        return (
          normalizedName !== "" &&
          normalizedName !== "string"
        );
      });

      const preparedTeams: EditableTeam[] =
        validTeams.map((team) => {
          const normalizedTeam: Team = {
            ...team,
            sportmonks_id:
              team.sportmonks_id ?? null,
            country: team.country ?? "",
            attack: Number(team.attack ?? 80),
            defense: Number(team.defense ?? 80),
            midfield: Number(team.midfield ?? 80),
            elo: Number(team.elo ?? 1800),
            home_advantage: Number(
              team.home_advantage ?? 1.1,
            ),
          };

          return {
            ...normalizedTeam,
            isEditing: false,
            original: {
              ...normalizedTeam,
            },
          };
        });

      preparedTeams.sort((firstTeam, secondTeam) =>
        firstTeam.name.localeCompare(
          secondTeam.name,
          undefined,
          {
            sensitivity: "base",
          },
        ),
      );

      setTeams(preparedTeams);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحميل الفرق.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const filteredTeams = useMemo(() => {
    const value = searchTerm
      .trim()
      .toLowerCase();

    if (!value) {
      return teams;
    }

    return teams.filter((team) => {
      const searchableText = [
        team.name,
        team.country ?? "",
        String(team.elo),
        String(team.attack),
        String(team.defense),
        String(team.midfield),
        team.sportmonks_id
          ? String(team.sportmonks_id)
          : "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(value);
    });
  }, [teams, searchTerm]);

  const averageElo = useMemo(() => {
    if (teams.length === 0) {
      return 0;
    }

    const totalElo = teams.reduce(
      (total, team) => total + team.elo,
      0,
    );

    return Math.round(totalElo / teams.length);
  }, [teams]);

  const connectedTeamsCount = useMemo(
    () =>
      teams.filter(
        (team) => team.sportmonks_id !== null,
      ).length,
    [teams],
  );

  const editingTeamsCount = useMemo(
    () =>
      teams.filter((team) => team.isEditing)
        .length,
    [teams],
  );

  function startEditing(teamId: number) {
    setMessage(null);

    setTeams((currentTeams) =>
      currentTeams.map((team) => ({
        ...team,

        /*
         * يسمح بتعديل فريق واحد فقط في الوقت نفسه.
         */
        isEditing: team.id === teamId,
      })),
    );
  }

  function cancelEditing(teamId: number) {
    setMessage(null);

    setTeams((currentTeams) =>
      currentTeams.map((team) => {
        if (team.id !== teamId) {
          return team;
        }

        return {
          ...team.original,
          isEditing: false,
          original: {
            ...team.original,
          },
        };
      }),
    );
  }

  function updateTextField(
    teamId: number,
    field: "name" | "country",
    value: string,
  ) {
    setTeams((currentTeams) =>
      currentTeams.map((team) =>
        team.id === teamId
          ? {
              ...team,
              [field]: value,
            }
          : team,
      ),
    );
  }

  function updateNumberField(
    teamId: number,
    field: NumberField,
    value: string,
  ) {
    const parsedValue = Number(value);

    setTeams((currentTeams) =>
      currentTeams.map((team) => {
        if (team.id !== teamId) {
          return team;
        }

        return {
          ...team,
          [field]:
            value.trim() === "" ||
            Number.isNaN(parsedValue)
              ? 0
              : parsedValue,
        };
      }),
    );
  }

  function validateTeam(
    team: EditableTeam,
  ): string | null {
    if (!team.name.trim()) {
      return "اسم الفريق مطلوب.";
    }

    if (
      team.name.trim().toLowerCase() ===
      "string"
    ) {
      return "يرجى إدخال اسم فريق حقيقي بدل كلمة string.";
    }

    if (
      !Number.isFinite(team.attack) ||
      team.attack < 0 ||
      team.attack > 100
    ) {
      return "قيمة الهجوم يجب أن تكون بين 0 و100.";
    }

    if (
      !Number.isFinite(team.defense) ||
      team.defense < 0 ||
      team.defense > 100
    ) {
      return "قيمة الدفاع يجب أن تكون بين 0 و100.";
    }

    if (
      !Number.isFinite(team.midfield) ||
      team.midfield < 0 ||
      team.midfield > 100
    ) {
      return "قيمة الوسط يجب أن تكون بين 0 و100.";
    }

    if (
      !Number.isFinite(team.elo) ||
      team.elo < 500 ||
      team.elo > 3000
    ) {
      return "تصنيف ELO يجب أن يكون بين 500 و3000.";
    }

    if (
      !Number.isFinite(
        team.home_advantage,
      ) ||
      team.home_advantage < 0.5 ||
      team.home_advantage > 2
    ) {
      return "أفضلية الأرض يجب أن تكون بين 0.5 و2.0.";
    }

    return null;
  }

  async function saveTeam(
    team: EditableTeam,
  ) {
    setMessage(null);

    const validationError =
      validateTeam(team);

    if (validationError) {
      setMessage({
        type: "error",
        text: validationError,
      });

      return;
    }

    setSavingTeamId(team.id);

    try {
      const response = await fetch(
        `${API_URL}/teams/${team.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: team.name.trim(),
            country:
              team.country?.trim() || null,
            attack: team.attack,
            defense: team.defense,
            midfield: team.midfield,
            elo: team.elo,
            home_advantage:
              team.home_advantage,
          }),
        },
      );

      if (!response.ok) {
        const detail = await getErrorMessage(
          response,
          "تعذر حفظ تعديلات الفريق.",
        );

        throw new Error(detail);
      }

      const updatedTeam =
        (await response.json()) as Team;

      const normalizedTeam: Team = {
        ...updatedTeam,
        sportmonks_id:
          updatedTeam.sportmonks_id ?? null,
        country: updatedTeam.country ?? "",
        attack: Number(updatedTeam.attack),
        defense: Number(
          updatedTeam.defense,
        ),
        midfield: Number(
          updatedTeam.midfield,
        ),
        elo: Number(updatedTeam.elo),
        home_advantage: Number(
          updatedTeam.home_advantage,
        ),
      };

      setTeams((currentTeams) =>
        currentTeams.map((currentTeam) => {
          if (currentTeam.id !== team.id) {
            return currentTeam;
          }

          return {
            ...normalizedTeam,
            isEditing: false,
            original: {
              ...normalizedTeam,
            },
          };
        }),
      );

      setMessage({
        type: "success",
        text: `تم حفظ تعديلات فريق ${normalizedTeam.name} بنجاح.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء الحفظ.",
      });
    } finally {
      setSavingTeamId(null);
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: "36px 20px",
        background:
          "linear-gradient(180deg, #020617 0%, #0f172a 100%)",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
            padding: "26px",
            marginBottom: "22px",
            border:
              "1px solid #1e293b",
            borderRadius: "24px",
            backgroundColor:
              "rgba(15, 23, 42, 0.92)",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#34d399",
                fontWeight: 900,
                fontSize: "14px",
              }}
            >
              FOOTBALL ANALYSIS AI
            </p>

            <h1
              style={{
                margin: "9px 0 0",
                fontSize: "36px",
                fontWeight: 950,
              }}
            >
              إدارة الفرق
            </h1>

            <p
              style={{
                margin: "9px 0 0",
                color: "#94a3b8",
                lineHeight: 1.7,
              }}
            >
              تعديل قوة الفرق وتصنيف ELO
              وأفضلية اللعب على الأرض ومراجعة
              حالة الربط مع Sportmonks.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => void loadTeams()}
              disabled={isLoading}
              style={{
                ...refreshButtonStyle,
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {isLoading
                ? "جاري التحديث..."
                : "تحديث البيانات"}
            </button>

            <Link
              href="/admin"
              style={secondaryLinkStyle}
            >
              لوحة التحكم
            </Link>

            <Link
              href="/admin/teams/new"
              style={primaryLinkStyle}
            >
              + إضافة فريق
            </Link>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            marginBottom: "22px",
          }}
        >
          <SummaryCard
            title="عدد الفرق"
            value={teams.length}
          />

          <SummaryCard
            title="نتائج البحث"
            value={filteredTeams.length}
          />

          <SummaryCard
            title="متوسط ELO"
            value={averageElo}
          />

          <SummaryCard
            title="مرتبطة بـ Sportmonks"
            value={connectedTeamsCount}
          />

          <SummaryCard
            title="فرق قيد التعديل"
            value={editingTeamsCount}
          />
        </section>

        <section
          style={{
            padding: "20px",
            marginBottom: "20px",
            borderRadius: "20px",
            border:
              "1px solid #1e293b",
            backgroundColor:
              "rgba(15, 23, 42, 0.92)",
          }}
        >
          <label
            htmlFor="team-search"
            style={{
              display: "block",
              marginBottom: "9px",
              color: "#cbd5e1",
              fontWeight: 800,
            }}
          >
            البحث عن فريق
          </label>

          <input
            id="team-search"
            type="search"
            value={searchTerm}
            onChange={(
              event: ChangeEvent<HTMLInputElement>,
            ) =>
              setSearchTerm(
                event.target.value,
              )
            }
            placeholder="اكتب اسم الفريق أو الدولة أو ELO أو Sportmonks ID"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 15px",
              borderRadius: "12px",
              border:
                "1px solid #334155",
              backgroundColor: "#020617",
              color: "#f8fafc",
              outline: "none",
              fontSize: "15px",
            }}
          />
        </section>

        {message ? (
          <div
            role="alert"
            style={{
              marginBottom: "20px",
              padding: "14px 16px",
              borderRadius: "13px",
              border:
                message.type === "success"
                  ? "1px solid #059669"
                  : "1px solid #dc2626",
              backgroundColor:
                message.type === "success"
                  ? "#022c22"
                  : "#450a0a",
              color:
                message.type === "success"
                  ? "#6ee7b7"
                  : "#fca5a5",
              fontWeight: 800,
            }}
          >
            {message.text}
          </div>
        ) : null}

        {isLoading ? (
          <LoadingBox />
        ) : filteredTeams.length === 0 ? (
          <EmptyBox />
        ) : (
          <section
            style={{
              overflowX: "auto",
              borderRadius: "22px",
              border:
                "1px solid #1e293b",
              backgroundColor:
                "rgba(15, 23, 42, 0.92)",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "1450px",
                borderCollapse: "collapse",
              }}
            >
              <thead
                style={{
                  backgroundColor: "#020617",
                }}
              >
                <tr>
                  <th style={headerCellStyle}>
                    الفريق
                  </th>

                  <th style={headerCellStyle}>
                    الدولة
                  </th>

                  <th style={headerCellStyle}>
                    Sportmonks
                  </th>

                  <th style={headerCellStyle}>
                    الهجوم
                  </th>

                  <th style={headerCellStyle}>
                    الدفاع
                  </th>

                  <th style={headerCellStyle}>
                    الوسط
                  </th>

                  <th style={headerCellStyle}>
                    ELO
                  </th>

                  <th style={headerCellStyle}>
                    أفضلية الأرض
                  </th>

                  <th style={headerCellStyle}>
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTeams.map((team) => (
                  <tr
                    key={team.id}
                    style={{
                      borderTop:
                        "1px solid #1e293b",
                    }}
                  >
                    <td style={bodyCellStyle}>
                      {team.isEditing ? (
                        <TextInput
                          value={team.name}
                          onChange={(value) =>
                            updateTextField(
                              team.id,
                              "name",
                              value,
                            )
                          }
                        />
                      ) : (
                        <div>
                          <strong
                            style={{
                              display: "block",
                              color: "#f8fafc",
                            }}
                          >
                            {team.name}
                          </strong>

                          <span
                            style={{
                              display: "block",
                              marginTop: "5px",
                              color: "#64748b",
                              fontSize: "12px",
                            }}
                          >
                            Team ID: {team.id}
                          </span>
                        </div>
                      )}
                    </td>

                    <td style={bodyCellStyle}>
                      {team.isEditing ? (
                        <TextInput
                          value={
                            team.country ?? ""
                          }
                          onChange={(value) =>
                            updateTextField(
                              team.id,
                              "country",
                              value,
                            )
                          }
                        />
                      ) : (
                        team.country ||
                        "غير محددة"
                      )}
                    </td>

                    <td style={bodyCellStyle}>
                      {team.sportmonks_id ? (
                        <div>
                          <StatusBadge
                            connected
                            text="مرتبط"
                          />

                          <span
                            style={{
                              display: "block",
                              marginTop: "6px",
                              color: "#64748b",
                              fontSize: "12px",
                            }}
                          >
                            ID:{" "}
                            {team.sportmonks_id}
                          </span>
                        </div>
                      ) : (
                        <StatusBadge
                          connected={false}
                          text="يدوي"
                        />
                      )}
                    </td>

                    <td style={bodyCellStyle}>
                      {team.isEditing ? (
                        <NumberInput
                          value={team.attack}
                          min={0}
                          max={100}
                          step={1}
                          onChange={(value) =>
                            updateNumberField(
                              team.id,
                              "attack",
                              value,
                            )
                          }
                        />
                      ) : (
                        <RatingBadge
                          value={team.attack}
                        />
                      )}
                    </td>

                    <td style={bodyCellStyle}>
                      {team.isEditing ? (
                        <NumberInput
                          value={team.defense}
                          min={0}
                          max={100}
                          step={1}
                          onChange={(value) =>
                            updateNumberField(
                              team.id,
                              "defense",
                              value,
                            )
                          }
                        />
                      ) : (
                        <RatingBadge
                          value={team.defense}
                        />
                      )}
                    </td>

                    <td style={bodyCellStyle}>
                      {team.isEditing ? (
                        <NumberInput
                          value={team.midfield}
                          min={0}
                          max={100}
                          step={1}
                          onChange={(value) =>
                            updateNumberField(
                              team.id,
                              "midfield",
                              value,
                            )
                          }
                        />
                      ) : (
                        <RatingBadge
                          value={team.midfield}
                        />
                      )}
                    </td>

                    <td style={bodyCellStyle}>
                      {team.isEditing ? (
                        <NumberInput
                          value={team.elo}
                          min={500}
                          max={3000}
                          step={1}
                          onChange={(value) =>
                            updateNumberField(
                              team.id,
                              "elo",
                              value,
                            )
                          }
                        />
                      ) : (
                        <strong
                          style={{
                            color: "#34d399",
                            fontSize: "16px",
                          }}
                        >
                          {team.elo}
                        </strong>
                      )}
                    </td>

                    <td style={bodyCellStyle}>
                      {team.isEditing ? (
                        <NumberInput
                          value={
                            team.home_advantage
                          }
                          min={0.5}
                          max={2}
                          step={0.01}
                          onChange={(value) =>
                            updateNumberField(
                              team.id,
                              "home_advantage",
                              value,
                            )
                          }
                        />
                      ) : (
                        <div>
                          <strong>
                            {team.home_advantage.toFixed(
                              2,
                            )}
                          </strong>

                          <span
                            style={{
                              display: "block",
                              marginTop: "5px",
                              color: "#64748b",
                              fontSize: "12px",
                            }}
                          >
                            +
                            {Math.round(
                              (team.home_advantage -
                                1) *
                                100,
                            )}
                            %
                          </span>
                        </div>
                      )}
                    </td>

                    <td style={bodyCellStyle}>
                      {team.isEditing ? (
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              void saveTeam(team)
                            }
                            disabled={
                              savingTeamId ===
                              team.id
                            }
                            style={{
                              ...saveButtonStyle,
                              opacity:
                                savingTeamId ===
                                team.id
                                  ? 0.6
                                  : 1,
                              cursor:
                                savingTeamId ===
                                team.id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {savingTeamId ===
                            team.id
                              ? "جاري الحفظ..."
                              : "حفظ"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              cancelEditing(
                                team.id,
                              )
                            }
                            disabled={
                              savingTeamId ===
                              team.id
                            }
                            style={{
                              ...cancelButtonStyle,
                              opacity:
                                savingTeamId ===
                                team.id
                                  ? 0.6
                                  : 1,
                            }}
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <Link
                            href={`/teams/${team.id}`}
                            style={
                              detailsLinkStyle
                            }
                          >
                            التفاصيل
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              startEditing(
                                team.id,
                              )
                            }
                            style={
                              editButtonStyle
                            }
                          >
                            تعديل مباشر
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}

async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const result =
      (await response.json()) as {
        detail?: unknown;
      };

    if (
      typeof result.detail === "string"
    ) {
      return result.detail;
    }

    if (Array.isArray(result.detail)) {
      return result.detail
        .map((item) => {
          if (
            typeof item === "object" &&
            item !== null &&
            "msg" in item
          ) {
            return String(
              (
                item as {
                  msg: unknown;
                }
              ).msg,
            );
          }

          return String(item);
        })
        .join("، ");
    }

    return fallback;
  } catch {
    return fallback;
  }
}

function SummaryCard({
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
        borderRadius: "17px",
        border: "1px solid #1e293b",
        backgroundColor:
          "rgba(15, 23, 42, 0.92)",
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
          fontSize: "29px",
          fontWeight: 950,
          color: "#34d399",
        }}
      >
        {value}
      </p>
    </article>
  );
}

function TextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      style={inputStyle}
    />
  );
}

function NumberInput({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(event) =>
        onChange(event.target.value)
      }
      style={{
        ...inputStyle,
        width: "92px",
        textAlign: "center",
      }}
    />
  );
}

function RatingBadge({
  value,
}: {
  value: number;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        minWidth: "46px",
        padding: "6px 9px",
        borderRadius: "999px",
        backgroundColor:
          value >= 85
            ? "#064e3b"
            : value >= 75
              ? "#1e3a8a"
              : value >= 65
                ? "#78350f"
                : "#450a0a",
        color:
          value >= 85
            ? "#6ee7b7"
            : value >= 75
              ? "#bfdbfe"
              : value >= 65
                ? "#fde68a"
                : "#fca5a5",
        fontWeight: 900,
      }}
    >
      {value}
    </span>
  );
}

function StatusBadge({
  connected,
  text,
}: {
  connected: boolean;
  text: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        minWidth: "62px",
        padding: "6px 10px",
        borderRadius: "999px",
        backgroundColor: connected
          ? "#064e3b"
          : "#78350f",
        color: connected
          ? "#6ee7b7"
          : "#fde68a",
        fontSize: "12px",
        fontWeight: 900,
      }}
    >
      {text}
    </span>
  );
}

function LoadingBox() {
  return (
    <div style={stateBoxStyle}>
      جارٍ تحميل الفرق...
    </div>
  );
}

function EmptyBox() {
  return (
    <div style={stateBoxStyle}>
      لا توجد فرق مطابقة لنتائج البحث.
    </div>
  );
}

const headerCellStyle = {
  padding: "16px",
  textAlign: "center" as const,
  whiteSpace: "nowrap" as const,
  color: "#cbd5e1",
  fontSize: "13px",
};

const bodyCellStyle = {
  padding: "15px",
  textAlign: "center" as const,
  whiteSpace: "nowrap" as const,
  color: "#cbd5e1",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "9px 10px",
  borderRadius: "9px",
  border: "1px solid #475569",
  backgroundColor: "#020617",
  color: "#f8fafc",
  outline: "none",
};

const primaryLinkStyle = {
  padding: "11px 16px",
  borderRadius: "11px",
  backgroundColor: "#34d399",
  color: "#052e16",
  textDecoration: "none",
  fontWeight: 900,
};

const secondaryLinkStyle = {
  padding: "11px 16px",
  borderRadius: "11px",
  border: "1px solid #475569",
  color: "#f8fafc",
  textDecoration: "none",
  fontWeight: 900,
};

const refreshButtonStyle = {
  padding: "11px 16px",
  borderRadius: "11px",
  border: "1px solid #0d9488",
  backgroundColor: "transparent",
  color: "#5eead4",
  fontWeight: 900,
};

const editButtonStyle = {
  padding: "9px 14px",
  borderRadius: "9px",
  border: "1px solid #3b82f6",
  backgroundColor: "transparent",
  color: "#93c5fd",
  fontWeight: 850,
  cursor: "pointer",
};

const detailsLinkStyle = {
  padding: "9px 14px",
  borderRadius: "9px",
  border: "1px solid #059669",
  backgroundColor: "transparent",
  color: "#6ee7b7",
  fontWeight: 850,
  textDecoration: "none",
};

const saveButtonStyle = {
  padding: "9px 14px",
  borderRadius: "9px",
  border: "none",
  backgroundColor: "#34d399",
  color: "#052e16",
  fontWeight: 900,
};

const cancelButtonStyle = {
  padding: "9px 14px",
  borderRadius: "9px",
  border: "1px solid #64748b",
  backgroundColor: "transparent",
  color: "#cbd5e1",
  fontWeight: 850,
  cursor: "pointer",
};

const stateBoxStyle = {
  padding: "36px",
  borderRadius: "20px",
  border: "1px dashed #475569",
  backgroundColor:
    "rgba(15, 23, 42, 0.92)",
  color: "#94a3b8",
  textAlign: "center" as const,
};