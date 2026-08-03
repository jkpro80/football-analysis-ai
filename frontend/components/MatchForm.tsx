"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type Team = {
  id: number;
  name: string;
  country: string;
};

type MatchData = {
  id: number;
  home_team_id: number;
  away_team_id: number;
  date: string;
  status: string;
};

type MatchFormData = {
  home_team_id: number;
  away_team_id: number;
  date: string;
  status: string;
};

type MatchFormProps = {
  match?: MatchData;
};

const emptyForm: MatchFormData = {
  home_team_id: 0,
  away_team_id: 0,
  date: "",
  status: "scheduled",
};

const fieldStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid #475569",
  backgroundColor: "#ffffff",
  color: "#111827",
  fontSize: "16px",
  outline: "none",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 700,
  color: "#334155",
};

export default function MatchForm({
  match,
}: MatchFormProps) {
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);

  const [formData, setFormData] =
    useState<MatchFormData>(
      match
        ? {
            home_team_id: match.home_team_id,
            away_team_id: match.away_team_id,
            date: match.date,
            status: match.status,
          }
        : emptyForm
    );

  const [isLoadingTeams, setIsLoadingTeams] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadTeams() {
      try {
        setError("");
        setIsLoadingTeams(true);

        const response = await fetch(
          "http://127.0.0.1:8000/teams",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "تعذر تحميل قائمة الفرق"
          );
        }

        const result: Team[] =
          await response.json();

        setTeams(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "حدث خطأ أثناء تحميل الفرق"
        );
      } finally {
        setIsLoadingTeams(false);
      }
    }

    loadTeams();
  }, []);

  function updateField(
    field: keyof MatchFormData,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]:
        field === "home_team_id" ||
        field === "away_team_id"
          ? Number(value)
          : value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      formData.home_team_id === 0 ||
      formData.away_team_id === 0
    ) {
      setError(
        "يرجى اختيار الفريق المضيف والفريق الضيف"
      );
      return;
    }

    if (
      formData.home_team_id ===
      formData.away_team_id
    ) {
      setError(
        "لا يمكن اختيار الفريق نفسه كمضيف وضيف"
      );
      return;
    }

    if (!formData.date) {
      setError("يرجى اختيار تاريخ المباراة");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = match
        ? `http://127.0.0.1:8000/matches/${match.id}`
        : "http://127.0.0.1:8000/matches";

      const response = await fetch(url, {
        method: match ? "PUT" : "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(formData),
      });

      let result: {
        detail?: string;
      } = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        throw new Error(
          result.detail ||
            (match
              ? "تعذر تعديل المباراة"
              : "تعذر إضافة المباراة")
        );
      }

      setSuccess(
        match
          ? "تم تعديل المباراة بنجاح"
          : "تمت إضافة المباراة بنجاح"
      );

      setTimeout(() => {
        router.push("/admin/matches");
        router.refresh();
      }, 700);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "حدث خطأ غير متوقع"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: "820px",
        display: "grid",
        gap: "22px",
      }}
    >
      {error && (
        <div
          style={{
            padding: "14px",
            borderRadius: "12px",
            border:
              "1px solid #ef4444",
            backgroundColor:
              "#fee2e2",
            color: "#991b1b",
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "14px",
            borderRadius: "12px",
            border:
              "1px solid #10b981",
            backgroundColor:
              "#dcfce7",
            color: "#166534",
            fontWeight: 700,
          }}
        >
          {success}
        </div>
      )}

      <div>
        <label
          htmlFor="home-team"
          style={labelStyle}
        >
          الفريق المضيف
        </label>

        <select
          id="home-team"
          required
          disabled={isLoadingTeams}
          value={formData.home_team_id}
          onChange={(event) =>
            updateField(
              "home_team_id",
              event.target.value
            )
          }
          style={fieldStyle}
        >
          <option value={0}>
            {isLoadingTeams
              ? "جارٍ تحميل الفرق..."
              : "اختر الفريق المضيف"}
          </option>

          {teams.map((team) => (
            <option
              key={team.id}
              value={team.id}
            >
              {team.name} — {team.country}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="away-team"
          style={labelStyle}
        >
          الفريق الضيف
        </label>

        <select
          id="away-team"
          required
          disabled={isLoadingTeams}
          value={formData.away_team_id}
          onChange={(event) =>
            updateField(
              "away_team_id",
              event.target.value
            )
          }
          style={fieldStyle}
        >
          <option value={0}>
            {isLoadingTeams
              ? "جارٍ تحميل الفرق..."
              : "اختر الفريق الضيف"}
          </option>

          {teams.map((team) => (
            <option
              key={team.id}
              value={team.id}
            >
              {team.name} — {team.country}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="match-date"
          style={labelStyle}
        >
          تاريخ المباراة
        </label>

        <input
          id="match-date"
          required
          type="date"
          value={formData.date}
          onChange={(event) =>
            updateField(
              "date",
              event.target.value
            )
          }
          style={fieldStyle}
        />
      </div>

      <div>
        <label
          htmlFor="match-status"
          style={labelStyle}
        >
          حالة المباراة
        </label>

        <select
          id="match-status"
          value={formData.status}
          onChange={(event) =>
            updateField(
              "status",
              event.target.value
            )
          }
          style={fieldStyle}
        >
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

      <button
        type="submit"
        disabled={
          isSubmitting ||
          isLoadingTeams
        }
        style={{
          padding: "14px 24px",
          border: "none",
          borderRadius: "12px",
          backgroundColor:
            isSubmitting ||
            isLoadingTeams
              ? "#94a3b8"
              : "#10b981",
          color: "#052e16",
          fontSize: "17px",
          fontWeight: 800,
          cursor:
            isSubmitting ||
            isLoadingTeams
              ? "not-allowed"
              : "pointer",
        }}
      >
        {isSubmitting
          ? "جارٍ الحفظ..."
          : match
          ? "حفظ التعديلات"
          : "حفظ المباراة"}
      </button>
    </form>
  );
}