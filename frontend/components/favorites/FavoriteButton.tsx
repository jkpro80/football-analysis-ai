"use client";

import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import {
  addFavorite,
  getFavoriteStatus,
  removeFavorite,
} from "@/lib/favorites-api";

const STORAGE_KEY =
  "football-analysis-favorite-fixtures";

function readLocalFavoriteIds(): number[] {
  try {
    const saved =
      window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((value) => Number(value))
      .filter(
        (value) =>
          Number.isInteger(value) &&
          value > 0,
      );
  } catch {
    return [];
  }
}

function writeLocalFavoriteIds(ids: number[]) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(Array.from(new Set(ids))),
  );
}

export default function FavoriteButton({
  matchId,
}: {
  matchId: number;
}) {
  const {
    accessToken,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const {
    locale,
    direction,
  } = useLocale();

  const t =
    locale === "ar"
      ? {
          saving: "جارٍ الحفظ...",
          remove: "★ إزالة من المفضلة",
          add: "☆ إضافة إلى المفضلة",
        }
      : locale === "sv"
        ? {
            saving: "Sparar...",
            remove: "★ Ta bort från favoriter",
            add: "☆ Lägg till i favoriter",
          }
        : {
            saving: "Saving...",
            remove: "★ Remove from favorites",
            add: "☆ Add to favorites",
          };

  const [isFavorite, setIsFavorite] =
    useState(false);

  const [isReady, setIsReady] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let active = true;

    async function loadStatus() {
      if (!isAuthenticated || !accessToken) {
        if (active) {
          setIsFavorite(
            readLocalFavoriteIds().includes(matchId),
          );
          setIsReady(true);
        }

        return;
      }

      try {
        const result =
          await getFavoriteStatus(
            accessToken,
            matchId,
          );

        if (active) {
          setIsFavorite(result.is_favorite);
        }
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, [
    accessToken,
    authLoading,
    isAuthenticated,
    matchId,
  ]);

  async function handleToggle() {
    if (!isReady || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      if (!isAuthenticated || !accessToken) {
        const ids = readLocalFavoriteIds();

        if (isFavorite) {
          writeLocalFavoriteIds(
            ids.filter((id) => id !== matchId),
          );
          setIsFavorite(false);
        } else {
          writeLocalFavoriteIds([
            ...ids,
            matchId,
          ]);
          setIsFavorite(true);
        }

        return;
      }

      if (isFavorite) {
        await removeFavorite(
          accessToken,
          matchId,
        );

        setIsFavorite(false);
      } else {
        await addFavorite(
          accessToken,
          matchId,
        );

        setIsFavorite(true);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div dir={direction} className="mt-1.5 sm:mt-3">
      <button
        type="button"
        disabled={!isReady || isSaving}
        onClick={() => void handleToggle()}
        aria-pressed={isFavorite}
        className={`w-full rounded-lg border px-2.5 py-1.5 text-[11px] font-black transition disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm ${
          isFavorite
            ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-400/40 hover:text-amber-300"
        }`}
      >
        {isSaving
          ? t.saving
          : isFavorite
            ? t.remove
            : t.add}
      </button>
    </div>
  );
}

