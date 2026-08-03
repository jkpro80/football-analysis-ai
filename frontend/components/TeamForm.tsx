"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Team = {
  id: number;
  name: string;
  country: string;
  attack: number;
  defense: number;
  midfield: number;
  elo: number;
  home_advantage: number;
  goals_scored: number;
  goals_conceded: number;
};

type TeamFormData = Omit<Team, "id">;

type TeamFormProps = {
  team?: Team;
};

const emptyForm: TeamFormData = {
  name: "",
  country: "",
  attack: 80,
  defense: 80,
  midfield: 80,
  elo: 1800,
  home_advantage: 1.1,
  goals_scored: 1.5,
  goals_conceded: 1,
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid #475569",
  backgroundColor: "#0f172a",
  color: "#ffffff",
  fontSize: "16px",
  outline: "none",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 700,
  color: "#334155",
};

export default function TeamForm({
  team,
}: TeamFormProps) {
  const router = useRouter();

  const [formData, setFormData] =
    useState<TeamFormData>(
      team
        ? {
            name: team.name,
            country: team.country,
            attack: team.attack,
            defense: team.defense,
            midfield: team.midfield,
            elo: team.elo,
            home_advantage: team.home_advantage,
            goals_scored: team.goals_scored,
            goals_conceded: team.goals_conceded,
          }
        : emptyForm
    );

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  function updateTextField(
    field: "name" | "country",
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateNumberField(
    field:
      | "attack"
      | "defense"
      | "midfield"
      | "elo"
      | "home_advantage"
      | "goals_scored"
      | "goals_conceded",
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]: Number(value),
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const url = team
        ? `http://127.0.0.1:8000/teams/${team.id}`
        : "http://127.0.0.1:8000/teams";

      const response = await fetch(url, {
        method: team ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail ||
            (team
              ? "تعذر تعديل الفريق"
              : "تعذر إضافة الفريق")
        );
      }

      router.push("/admin/teams");
      router.refresh();
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
        display: "grid",
        gap: "22px",
      }}
    >
      {error && (
        <div
          style={{
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #ef4444",
            backgroundColor: "#450a0a",
            color: "#fecaca",
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label style={labelStyle}>اسم الفريق</label>
        <input
          required
          value={formData.name}
          onChange={(event) =>
            updateTextField("name", event.target.value)
          }
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>الدولة</label>
        <input
          required
          value={formData.country}
          onChange={(event) =>
            updateTextField("country", event.target.value)
          }
          style={inputStyle}
        />
      </div>

      {[
        ["attack", "قوة الهجوم", 0, 100, 1],
        ["defense", "قوة الدفاع", 0, 100, 1],
        ["midfield", "قوة الوسط", 0, 100, 1],
        ["elo", "تصنيف ELO", 500, 3000, 1],
        ["home_advantage", "أفضلية الأرض", 0.5, 2, 0.01],
        ["goals_scored", "متوسط الأهداف المسجلة", 0, 10, 0.1],
        ["goals_conceded", "متوسط الأهداف المستقبلة", 0, 10, 0.1],
      ].map(([field, label, min, max, step]) => (
        <div key={String(field)}>
          <label style={labelStyle}>
            {String(label)}
          </label>

          <input
            required
            type="number"
            min={Number(min)}
            max={Number(max)}
            step={Number(step)}
            value={
              formData[
                field as keyof TeamFormData
              ] as number
            }
            onChange={(event) =>
              updateNumberField(
                field as
                  | "attack"
                  | "defense"
                  | "midfield"
                  | "elo"
                  | "home_advantage"
                  | "goals_scored"
                  | "goals_conceded",
                event.target.value
              )
            }
            style={inputStyle}
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: "14px 24px",
          border: "none",
          borderRadius: "12px",
          backgroundColor: isSubmitting
            ? "#94a3b8"
            : "#10b981",
          color: "#052e16",
          fontWeight: 800,
          fontSize: "17px",
          cursor: isSubmitting
            ? "not-allowed"
            : "pointer",
        }}
      >
        {isSubmitting
          ? "جارٍ الحفظ..."
          : team
          ? "حفظ التعديلات"
          : "حفظ الفريق"}
      </button>
    </form>
  );
}