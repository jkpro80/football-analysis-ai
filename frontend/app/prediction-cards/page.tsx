"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { apiFetch } from "@/lib/api";

import {
  generatePredictionCard,
  getPredictionCards,
  deletePredictionCard,
  type PredictionCard,
  type PredictionCardItem,
  type PredictionCardGenerateMode,
} from "@/lib/prediction-cards-api";


type CardMatch = {
  id: number;
  home_team: string;
  away_team: string;
  date: string;
  status: string;
};

function normalizeCardMatch(value: unknown): CardMatch | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const match = value as Record<string, unknown>;
  const id = Number(match.id);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return {
    id,
    home_team: String(
      match.home_team ?? match.home_team_name ?? "Home Team",
    ),
    away_team: String(
      match.away_team ?? match.away_team_name ?? "Away Team",
    ),
    date: String(match.date ?? ""),
    status: String(match.status ?? "unknown"),
  };
}

function errorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Unknown error";
}


function percentage(
  value: number | null | undefined,
): string {
  if (value == null) {
    return "—";
  }

  const normalized =
    value <= 1
      ? value * 100
      : value;

  return `${normalized.toFixed(1)}%`;
}


function formatDate(
  value: string | null,
  locale: string,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const localeName =
    locale === "ar"
      ? "ar-IQ"
      : locale === "sv"
        ? "sv-SE"
        : "en-GB";

  return new Intl.DateTimeFormat(
    localeName,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(date);
}


export default function PredictionCardsPage() {
  const router = useRouter();

  const {
    user,
    isLoading: authLoading,
  } = useAuth();

  const { locale } = useLocale();

  const isAdmin =
    user?.role === "admin";

  const hasPremiumAccess =
    isAdmin ||
    (
      user?.subscription?.status?.toLowerCase() === "active" &&
      user?.subscription?.plan?.code?.toLowerCase() === "premium"
    );

  const text =
    locale === "ar"
      ? {
          title: "بطاقاتي المحفوظة",
          subtitle:
            "أنشئ وأدر بطاقات التوقعات الذكية الخاصة بك.",

          createTitle:
            "إنشاء بطاقة جديدة",

          createDescription:
            "اختر طريقة إنشاء البطاقة، وسيستخدم Målx أعلى الترشيحات المؤهلة حسب الثقة والاحتمال.",

          modeAutomatic: "تلقائي",
          modeToday: "مباريات اليوم",
          modeSingle: "مباراة منفردة",
          modeAccumulator: "تراكمي ذكي",
          modeAutomaticHelp: "أفضل الترشيحات من المباريات القادمة.",
          modeTodayHelp: "أفضل الترشيحات من المباريات المجدولة اليوم فقط.",
          modeSingleHelp: "اختر مباراة واحدة ليحلل Målx أقوى الأسواق المتاحة لها.",
          modeAccumulatorHelp: "اختيارات عالية الثقة من مباريات ودوريات مختلفة.",
          chooseMatch: "اختر المباراة",
          loadingMatches: "جارٍ تحميل المباريات...",
          noMatches: "لا توجد مباريات قادمة متاحة للاختيار.",
          selectMatchFirst: "اختر مباراة أولًا.",
          highestConfidence: "أعلى ثقة متاحة وفق نموذج Målx",

          choose:
            "عدد الترشيحات",

          generate:
            "إنشاء بطاقة",

          generating:
            "جارٍ إنشاء البطاقة...",

          cardsTitle:
            "بطاقاتي المحفوظة",

          filterAll: "الكل",
          filterActive: "النشطة",
          filterWon: "الرابحة",
          filterLost: "الخاسرة",
          noFilteredCards: "لا توجد بطاقات ضمن هذا التصنيف.",
          fromDate: "من تاريخ",
          toDate: "إلى تاريخ",
          clearDates: "مسح الفترة",

          totalCards:
            "إجمالي البطاقات",

          wonCards:
            "رابحة",

          pendingCards:
            "قيد الانتظار",

          lostCards:
            "خاسرة",

          howTitle:
            "كيف تعمل؟",

          howText:
            "يتم اختيار التوقعات تلقائيًا بناءً على أعلى درجة ثقة وقوة احتمال. بعد انتهاء المباريات تتم مقارنة كل توقع بالنتيجة الفعلية، وتصبح البطاقة رابحة فقط عندما تكون جميع توقعاتها صحيحة.",

          predictions:
            "توقعات",

          evaluated:
            "تم تقييم",

          correct:
            "صحيحة",

          wrong:
            "خاطئة",

          success:
            "نسبة النجاح",

          pending:
            "قيد الانتظار",

          won:
            "رابحة",

          lost:
            "خاسرة",

          probability:
            "الاحتمال",

          confidence:
            "الثقة",

          result:
            "النتيجة",

          waiting:
            "بانتظار النتيجة",

          correctPrediction:
            "التوقع صحيح",

          wrongPrediction:
            "التوقع خاطئ",

          match:
            "المباراة",

          matchResult:
            "نتيجة المباراة",

          goals25:
            "مجموع الأهداف",

          btts:
            "تسجيل الفريقين",

          totalCorners:
            "إجمالي الركنيات",

          corners:
            "ركنيات",

          homeWin:
            "فوز المضيف",

          awayWin:
            "فوز الضيف",

          draw:
            "تعادل",

          over:
            "أكثر من",

          under:
            "أقل من",

          yes:
            "نعم",

          no:
            "لا",

          loadFailed:
            "تعذر تحميل البطاقات.",

          generateFailed:
            "تعذر إنشاء البطاقة.",

          generated:
            "تم إنشاء البطاقة وحفظها بنجاح.",

          empty:
            "لا توجد بطاقات محفوظة حتى الآن.",

          openHint:
            "اضغط على أي بطاقة لعرض تفاصيل التوقعات ونتائجها.",
        }

      : locale === "sv"
        ? {
            title: "Mina sparade kuponger",
            subtitle:
              "Skapa och hantera dina smarta prognoskuponger.",

            createTitle:
              "Skapa ny kupong",

            createDescription:
              "Välj hur kupongen ska skapas. Målx använder de starkaste kvalificerade prognoserna.",

            modeAutomatic: "Automatisk",
            modeToday: "Dagens matcher",
            modeSingle: "En match",
            modeAccumulator: "Smart kombination",
            modeAutomaticHelp: "De bästa prognoserna från kommande matcher.",
            modeTodayHelp: "De bästa prognoserna från matcher som är schemalagda idag.",
            modeSingleHelp: "Välj en match så analyserar Målx de starkaste tillgängliga marknaderna.",
            modeAccumulatorHelp: "Högkonfidensval från olika matcher och ligor.",
            chooseMatch: "Välj match",
            loadingMatches: "Laddar matcher...",
            noMatches: "Inga kommande matcher finns att välja.",
            selectMatchFirst: "Välj en match först.",
            highestConfidence: "Högsta tillgängliga konfidens enligt Målx",

            choose:
              "Antal prognoser",

            generate:
              "Skapa kupong",

            generating:
              "Skapar kupong...",

            cardsTitle:
              "Mina sparade kuponger",

            filterAll: "Alla",
            filterActive: "Aktiva",
            filterWon: "Vunna",
            filterLost: "Förlorade",
            noFilteredCards: "Inga kuponger finns i den här kategorin.",
            fromDate: "Från datum",
            toDate: "Till datum",
            clearDates: "Rensa period",

            totalCards:
              "Totalt",

            wonCards:
              "Vunna",

            pendingCards:
              "Väntar",

            lostCards:
              "Förlorade",

            howTitle:
              "Hur fungerar det?",

            howText:
              "Prognoser väljs automatiskt efter högst konfidens och sannolikhet. När matcherna är slut jämförs varje prognos med det faktiska resultatet.",

            predictions:
              "prognoser",

            evaluated:
              "Utvärderade",

            correct:
              "rätt",

            wrong:
              "fel",

            success:
              "Träffsäkerhet",

            pending:
              "Väntar",

            won:
              "Vunnen",

            lost:
              "Förlorad",

            probability:
              "Sannolikhet",

            confidence:
              "Konfidens",

            result:
              "Resultat",

            waiting:
              "Väntar på resultat",

            correctPrediction:
              "Rätt prognos",

            wrongPrediction:
              "Fel prognos",

            match:
              "Match",

            matchResult:
              "Matchresultat",

            goals25:
              "Totala mål",

            btts:
              "Båda lagen gör mål",

            totalCorners:
              "Totala hörnor",

            corners:
              "Hörnor",

            homeWin:
              "Hemmaseger",

            awayWin:
              "Bortaseger",

            draw:
              "Oavgjort",

            over:
              "Över",

            under:
              "Under",

            yes:
              "Ja",

            no:
              "Nej",

            loadFailed:
              "Kunde inte ladda kuponger.",

            generateFailed:
              "Kunde inte skapa kupongen.",

            generated:
              "Kupongen skapades och sparades.",

            empty:
              "Inga sparade kuponger ännu.",

            openHint:
              "Klicka på en kupong för att visa prognoser och resultat.",
          }

        : {
            title: "My Saved Cards",
            subtitle:
              "Create and manage your smart prediction cards.",

            createTitle:
              "Create New Card",

            createDescription:
              "Choose how to build the card. Målx uses the strongest eligible predictions by confidence and probability.",

            modeAutomatic: "Automatic",
            modeToday: "Today's Matches",
            modeSingle: "Single Match",
            modeAccumulator: "Smart Accumulator",
            modeAutomaticHelp: "The strongest predictions from upcoming matches.",
            modeTodayHelp: "The strongest predictions from matches scheduled today only.",
            modeSingleHelp: "Choose one match and Målx will evaluate its strongest available markets.",
            modeAccumulatorHelp: "High-confidence selections from different matches and leagues.",
            chooseMatch: "Choose match",
            loadingMatches: "Loading matches...",
            noMatches: "No upcoming matches are available.",
            selectMatchFirst: "Choose a match first.",
            highestConfidence: "Highest available confidence according to Målx",

            choose:
              "Number of predictions",

            generate:
              "Generate Card",

            generating:
              "Generating card...",

            cardsTitle:
              "My Saved Cards",

            filterAll: "All",
            filterActive: "Active",
            filterWon: "Won",
            filterLost: "Lost",
            noFilteredCards: "No cards in this category.",
            fromDate: "From date",
            toDate: "To date",
            clearDates: "Clear dates",

            totalCards:
              "Total Cards",

            wonCards:
              "Won",

            pendingCards:
              "Pending",

            lostCards:
              "Lost",

            howTitle:
              "How does it work?",

            howText:
              "Predictions are automatically selected using the strongest confidence and probability signals. Results are evaluated after the matches finish.",

            predictions:
              "predictions",

            evaluated:
              "Evaluated",

            correct:
              "correct",

            wrong:
              "wrong",

            success:
              "Success rate",

            pending:
              "Pending",

            won:
              "Won",

            lost:
              "Lost",

            probability:
              "Probability",

            confidence:
              "Confidence",

            result:
              "Result",

            waiting:
              "Waiting for result",

            correctPrediction:
              "Prediction correct",

            wrongPrediction:
              "Prediction wrong",

            match:
              "Match",

            matchResult:
              "Match Result",

            goals25:
              "Total Goals",

            btts:
              "Both Teams to Score",

            totalCorners:
              "Total Corners",

            corners:
              "Corners",

            homeWin:
              "Home Win",

            awayWin:
              "Away Win",

            draw:
              "Draw",

            over:
              "Over",

            under:
              "Under",

            yes:
              "Yes",

            no:
              "No",

            loadFailed:
              "Unable to load cards.",

            generateFailed:
              "Unable to generate card.",

            generated:
              "Card generated and saved successfully.",

            empty:
              "No saved cards yet.",

            openHint:
              "Click any card to view its predictions and results.",
          };


  const counts = Array.from(
    { length: 15 },
    (_, index) => index + 1,
  );


  const [selectedCount, setSelectedCount] =
    useState(5);

  const [generateMode, setGenerateMode] =
    useState<PredictionCardGenerateMode>("automatic");

  const [availableMatches, setAvailableMatches] =
    useState<CardMatch[]>([]);

  const [selectedMatchId, setSelectedMatchId] =
    useState<number | null>(null);

  const [matchesLoading, setMatchesLoading] =
    useState(false);

  const [cards, setCards] =
    useState<PredictionCard[]>([]);

  const [cardFilter, setCardFilter] =
    useState<"all" | "active" | "won" | "lost">("all");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [openCardId, setOpenCardId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [deletingCardId, setDeletingCardId] =
    useState<number | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!hasPremiumAccess) {
      router.replace("/subscription");
    }
  }, [
    authLoading,
    hasPremiumAccess,
    router,
  ]);


  useEffect(() => {
    if (
      authLoading ||
      !hasPremiumAccess
    ) {
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);

      try {
        const result =
          await getPredictionCards();

        if (active) {
          setCards(result);
        }

      } catch (loadError) {
        if (active) {
          setError(
            `${text.loadFailed} ${errorMessage(
              loadError,
            )}`,
          );
        }

      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [
    locale,
    authLoading,
    hasPremiumAccess,
  ]);


  useEffect(() => {
    if (
      authLoading ||
      !hasPremiumAccess ||
      !cards.some((card) => card.status === "pending")
    ) {
      return;
    }

    let active = true;
    let refreshing = false;

    async function refreshCards() {
      if (
        !active ||
        refreshing ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      refreshing = true;

      try {
        const result = await getPredictionCards();
        if (active) {
          setCards(result);
        }
      } catch {
        // Silent background refresh; keep the current cards visible.
      } finally {
        refreshing = false;
      }
    }

    const intervalId = window.setInterval(() => {
      void refreshCards();
    }, 60000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshCards();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [
    authLoading,
    hasPremiumAccess,
    cards,
  ]);


  useEffect(() => {
    if (
      authLoading ||
      !hasPremiumAccess ||
      generateMode !== "single"
    ) {
      return;
    }

    let active = true;

    async function loadMatches() {
      setMatchesLoading(true);

      try {
        const data = await apiFetch<unknown>(
          "/prediction-cards/eligible-matches",
        );

        const matches = Array.isArray(data)
          ? data
              .map(normalizeCardMatch)
              .filter((match): match is CardMatch => match !== null)
              .sort(
                (a, b) =>
                  new Date(a.date).getTime() -
                  new Date(b.date).getTime(),
              )
          : [];

        if (active) {
          setAvailableMatches(matches);
          setSelectedMatchId((current) =>
            current != null &&
            matches.some((match) => match.id === current)
              ? current
              : null,
          );
        }
      } catch (loadError) {
        if (active) {
          setAvailableMatches([]);
          setError(errorMessage(loadError));
        }
      } finally {
        if (active) {
          setMatchesLoading(false);
        }
      }
    }

    void loadMatches();

    return () => {
      active = false;
    };
  }, [
    authLoading,
    hasPremiumAccess,
    generateMode,
  ]);


  const statistics = useMemo(() => {
    return cards.reduce(
      (result, card) => {
        result.total += 1;

        if (card.status === "won") {
          result.won += 1;
        } else if (card.status === "lost") {
          result.lost += 1;
        } else {
          result.pending += 1;
        }

        return result;
      },
      {
        total: 0,
        won: 0,
        lost: 0,
        pending: 0,
      },
    );
  }, [cards]);

  const cardWinRate = useMemo(() => {
    const resolved =
      statistics.won + statistics.lost;

    if (resolved === 0) {
      return "—";
    }

    return `${(
      (statistics.won / resolved) * 100
    ).toFixed(1)}%`;
  }, [statistics]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesStatus =
        cardFilter === "all"
          ? true
          : cardFilter === "active"
            ? card.status === "pending"
            : card.status === cardFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!fromDate && !toDate) {
        return true;
      }

      if (!card.created_at) { return false; }

      const createdAt = new Date(card.created_at);

      if (Number.isNaN(createdAt.getTime())) {
        return false;
      }

      const localDate = [
        createdAt.getFullYear(),
        String(createdAt.getMonth() + 1).padStart(2, "0"),
        String(createdAt.getDate()).padStart(2, "0"),
      ].join("-");

      if (fromDate && localDate < fromDate) {
        return false;
      }

      if (toDate && localDate > toDate) {
        return false;
      }

      return true;
    });
  }, [cards, cardFilter, fromDate, toDate]);


  async function handleGenerate() {
    setGenerating(true);
    setMessage(null);
    setError(null);

    try {
      if (
        generateMode === "single" &&
        selectedMatchId == null
      ) {
        throw new Error(text.selectMatchFirst);
      }

      const card =
        await generatePredictionCard({
          mode: generateMode,
          count: selectedCount,
          match_id:
            generateMode === "single"
              ? selectedMatchId
              : undefined,
          timezone_offset_minutes:
            generateMode === "today"
              ? -new Date().getTimezoneOffset()
              : undefined,
        });

      setCards((current) => [
        card,
        ...current.filter(
          (item) =>
            item.id !== card.id,
        ),
      ]);

      setOpenCardId(card.id);
      setMessage(text.generated);

    } catch (generateError) {
      setError(
        `${text.generateFailed} ${errorMessage(
          generateError,
        )}`,
      );

    } finally {
      setGenerating(false);
    }
  }


  async function handleDeleteCard(
    cardId: number,
  ) {
    const confirmMessage =
      locale === "ar"
        ? "هل أنت متأكد من حذف هذه البطاقة؟ لا يمكن التراجع عن هذا الإجراء."
        : locale === "sv"
          ? "Är du säker på att du vill ta bort kortet? Åtgärden kan inte ångras."
          : "Are you sure you want to delete this card? This action cannot be undone.";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeletingCardId(cardId);
    setMessage(null);
    setError(null);

    try {
      await deletePredictionCard(cardId);

      const refreshedCards =
        await getPredictionCards();

      setCards(refreshedCards);

      setOpenCardId((current) =>
        current === cardId
          ? null
          : current,
      );

      setMessage(
        locale === "ar"
          ? "تم حذف البطاقة بنجاح."
          : locale === "sv"
            ? "Kortet har tagits bort."
            : "Card deleted successfully.",
      );
    } catch (deleteError) {
      setError(
        locale === "ar"
          ? "تعذر حذف البطاقة: " + errorMessage(deleteError)
          : locale === "sv"
            ? "Kortet kunde inte tas bort: " + errorMessage(deleteError)
            : "Could not delete card: " + errorMessage(deleteError),
      );
    } finally {
      setDeletingCardId(null);
    }
  }


  function toggleCard(cardId: number) {
    setOpenCardId((current) =>
      current === cardId
        ? null
        : cardId,
    );
  }


  function statusLabel(
    status: string,
  ): string {
    if (status === "won") {
      return `✓ ${text.won}`;
    }

    if (status === "lost") {
      return `✕ ${text.lost}`;
    }

    return `⌛ ${text.pending}`;
  }


  function statusClasses(
    status: string,
  ): string {
    if (status === "won") {
      return (
        "border-emerald-400/20 " +
        "bg-emerald-400/[0.08] " +
        "text-emerald-300"
      );
    }

    if (status === "lost") {
      return (
        "border-rose-400/20 " +
        "bg-rose-400/[0.08] " +
        "text-rose-300"
      );
    }

    return (
      "border-amber-400/25 " +
      "bg-amber-400/[0.08] " +
      "text-amber-300"
    );
  }


  function successRate(
    card: PredictionCard,
  ): string {
    if (
      card.resolved_count <= 0
    ) {
      return "—";
    }

    return `${(
      (
        card.won_count /
        card.resolved_count
      ) * 100
    ).toFixed(1)}%`;
  }


  function matchName(
    item: PredictionCardItem,
  ): string {
    if (
      item.home_team &&
      item.away_team
    ) {
      return (
        `${item.home_team} vs ` +
        `${item.away_team}`
      );
    }

    return `${text.match} #${item.match_id}`;
  }


  function marketLabel(
    item: PredictionCardItem,
  ): string {
    switch (item.market) {
      case "1x2":
        return text.matchResult;

      case "goals_2_5":
        return `${text.goals25} 2.5`;

      case "btts":
        return text.btts;

      case "corners_total":
        return text.totalCorners;

      case "corners_home":
        return item.home_team
          ? `${text.corners} ${item.home_team}`
          : text.corners;

      case "corners_away":
        return item.away_team
          ? `${text.corners} ${item.away_team}`
          : text.corners;

      default:
        return item.market;
    }
  }


  function selectionLabel(
    item: PredictionCardItem,
  ): string {
    const selection =
      item.selection.toLowerCase();

    if (item.market === "1x2") {
      if (selection === "home") {
        return item.home_team
          ? `${text.homeWin}: ${item.home_team}`
          : text.homeWin;
      }

      if (selection === "away") {
        return item.away_team
          ? `${text.awayWin}: ${item.away_team}`
          : text.awayWin;
      }

      if (selection === "draw") {
        return text.draw;
      }
    }

    if (selection === "over") {
      const line =
        item.line != null
          ? ` ${item.line}`
          : item.market === "goals_2_5"
            ? " 2.5"
            : "";

      return `${text.over}${line}`;
    }

    if (selection === "under") {
      const line =
        item.line != null
          ? ` ${item.line}`
          : item.market === "goals_2_5"
            ? " 2.5"
            : "";

      return `${text.under}${line}`;
    }

    if (selection === "yes") {
      return text.yes;
    }

    if (selection === "no") {
      return text.no;
    }

    return item.selection;
  }


  function itemStatus(
    item: PredictionCardItem,
  ) {
    if (
      item.evaluation_status === "won"
    ) {
      return {
        label:
          `✓ ${text.correctPrediction}`,
        classes:
          "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300",
      };
    }

    if (
      item.evaluation_status === "lost"
    ) {
      return {
        label:
          `✕ ${text.wrongPrediction}`,
        classes:
          "border-rose-400/20 bg-rose-400/[0.07] text-rose-300",
      };
    }

    return {
      label:
        `⌛ ${text.waiting}`,
      classes:
        "border-amber-400/20 bg-amber-400/[0.07] text-amber-300",
    };
  }


  if (
    authLoading ||
    !hasPremiumAccess
  ) {
    return (
      <main className="min-h-screen bg-[#080A0D]" />
    );
  }

  return (
    <main
      className="min-h-screen bg-[#080A0D] px-4 py-6 text-white sm:px-6 lg:px-8"
      dir={
        locale === "ar"
          ? "rtl"
          : "ltr"
      }
    >
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
            Målx Prediction Engine
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            {text.title}
          </h1>

          <p className="mt-2 text-sm text-white/65">
            {text.subtitle}
          </p>
        </div>


        {/* CREATE + STATS */}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">

          {/* CREATE CARD */}

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0C1014] to-[#050b1b] p-5 sm:p-6">

            <div>
              <h2 className="text-lg font-black text-white">
                ✨ {text.createTitle}
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/65">
                {text.createDescription}
              </p>
            </div>


            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {([
                ["automatic", text.modeAutomatic],
                ["today", text.modeToday],
                ["single", text.modeSingle],
                ["accumulator", text.modeAccumulator],
              ] as const).map(([mode, label]) => {
                const active = generateMode === mode;

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setGenerateMode(mode);
                      if (mode === "single") {
                        setSelectedCount((current) => Math.min(current, 6));
                      }
                      setMessage(null);
                      setError(null);
                    }}
                    className={[
                      "rounded-xl border px-4 py-3 text-start transition",
                      active
                        ? "border-cyan-300 bg-cyan-400/15 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
                        : "border-white/10 bg-[#040b1b] text-white/70 hover:border-cyan-400/30 hover:text-white",
                    ].join(" ")}
                  >
                    <span className="block text-sm font-black">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-xs leading-5 text-white/55">
              {generateMode === "today"
                ? text.modeTodayHelp
                : generateMode === "single"
                  ? text.modeSingleHelp
                  : generateMode === "accumulator"
                    ? text.modeAccumulatorHelp
                    : text.modeAutomaticHelp}
            </p>

            {generateMode === "single" && (
              <div className="mt-5">
                <label
                  htmlFor="prediction-card-match"
                  className="mb-2 block text-xs font-black text-white/80"
                >
                  {text.chooseMatch}
                </label>

                <select
                  id="prediction-card-match"
                  value={selectedMatchId ?? ""}
                  onChange={(event) =>
                    setSelectedMatchId(
                      event.target.value
                        ? Number(event.target.value)
                        : null,
                    )
                  }
                  disabled={matchesLoading}
                  className="w-full rounded-xl border border-white/10 bg-[#040b1b] px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-400/50 disabled:opacity-50"
                >
                  <option value="">
                    {matchesLoading
                      ? text.loadingMatches
                      : availableMatches.length === 0
                        ? text.noMatches
                        : text.chooseMatch}
                  </option>

                  {availableMatches.map((match) => (
                    <option
                      key={match.id}
                      value={match.id}
                    >
                      {match.home_team} vs {match.away_team} ·{" "}
                      {formatDate(match.date, locale)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-5 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] px-4 py-3 text-xs font-bold text-cyan-200">
              ⚡ {text.highestConfidence}
            </div>

            <p className="mt-6 text-xs font-black text-white/80">
              {text.choose}
            </p>


            <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-[repeat(15,minmax(0,1fr))]">

              {counts.filter((count) => (generateMode !== "single" || count <= 6) && (generateMode !== "accumulator" || count >= 2)).map((count) => {
                const active =
                  count === selectedCount;

                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() =>
                      setSelectedCount(count)
                    }
                    className={[
                      "rounded-lg border px-2 py-2.5 text-xs font-black transition",
                      active
                        ? "border-cyan-300 bg-cyan-400/15 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                        : "border-white/10 bg-[#040b1b] text-white/80 hover:border-cyan-400/40 hover:text-cyan-300",
                    ].join(" ")}
                  >
                    {count}
                  </button>
                );
              })}

            </div>


            <button
              type="button"
              onClick={handleGenerate}
              disabled={
                generating ||
                (generateMode === "single" && selectedMatchId == null)
              }
              className="mt-5 w-full rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating
                ? text.generating
                : `⚽ ${text.generate} · ${selectedCount}`}
            </button>


            {message && (
              <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm font-bold text-emerald-300">
                {message}
              </div>
            )}


            {error && (
              <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm font-bold text-rose-300">
                {error}
              </div>
            )}

          </div>


          {/* STATS */}

          <div className="space-y-5">

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">

              <div className="rounded-2xl border border-cyan-400/15 bg-[#061225] p-4">
                <div className="text-xs font-bold text-cyan-400">
                  {text.totalCards}
                </div>

                <div className="mt-2 text-2xl font-black">
                  {statistics.total}
                </div>
              </div>


              <div className="rounded-2xl border border-emerald-400/15 bg-[#061225] p-4">
                <div className="text-xs font-bold text-emerald-400">
                  {text.wonCards}
                </div>

                <div className="mt-2 text-2xl font-black">
                  {statistics.won}
                </div>
              </div>


              <div className="rounded-2xl border border-amber-400/15 bg-[#061225] p-4">
                <div className="text-xs font-bold text-amber-400">
                  {text.pendingCards}
                </div>

                <div className="mt-2 text-2xl font-black">
                  {statistics.pending}
                </div>
              </div>


              <div className="rounded-2xl border border-rose-400/15 bg-[#061225] p-4">
                <div className="text-xs font-bold text-rose-400">
                  {text.lostCards}
                </div>

                <div className="mt-2 text-2xl font-black">
                  {statistics.lost}
                </div>
              </div>

              <div className="rounded-2xl border border-violet-400/15 bg-[#061225] p-4">
                <div className="text-xs font-bold text-violet-300">
                  {text.success}
                </div>

                <div className="mt-2 text-2xl font-black">
                  {cardWinRate}
                </div>
              </div>

            </div>


            <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.05] p-5">

              <h3 className="font-black text-cyan-300">
                ⓘ {text.howTitle}
              </h3>

              <p className="mt-2 text-sm leading-7 text-white/65">
                {text.howText}
              </p>

            </div>

          </div>

        </section>


        {/* SAVED CARDS */}

        <section className="mt-8">

          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">

            <h2 className="text-2xl font-black">
              {text.cardsTitle}
            </h2>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-white/65">
              {filteredCards.length}/{cards.length}
            </span>

          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {([
              ["all", text.filterAll, statistics.total],
              ["active", text.filterActive, statistics.pending],
              ["won", text.filterWon, statistics.won],
              ["lost", text.filterLost, statistics.lost],
            ] as const).map(([filter, label, count]) => {
              const active = cardFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setCardFilter(filter)}
                  className={[
                    "rounded-xl border px-4 py-2 text-xs font-black transition",
                    active
                      ? "border-cyan-300 bg-cyan-400/15 text-cyan-200"
                      : "border-white/10 bg-white/[0.03] text-white/60 hover:border-cyan-400/30 hover:text-white",
                  ].join(" ")}
                >
                  {label} · {count}
                </button>
              );
            })}
          </div>

          <div className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-black text-white/65">
                {text.fromDate}
              </span>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#040b1b] px-3 py-2.5 text-sm font-bold text-white outline-none transition focus:border-cyan-400/50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black text-white/65">
                {text.toDate}
              </span>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#040b1b] px-3 py-2.5 text-sm font-bold text-white outline-none transition focus:border-cyan-400/50"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              disabled={!fromDate && !toDate}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-black text-white/70 transition hover:border-cyan-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              {text.clearDates}
            </button>
          </div>


          {loading ? (

            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-sm text-white/50">
              ...
            </div>

          ) : cards.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-sm text-white/50">
              {text.empty}
            </div>

          ) : filteredCards.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-sm text-white/50">
              {text.noFilteredCards}
            </div>

          ) : (

            <div className="space-y-3">

              {filteredCards.map((card) => {
                const open =
                  openCardId === card.id;

                return (
                  <article
                    key={card.id}
                    className={[
                      "overflow-hidden rounded-2xl border transition",
                      open
                        ? "border-cyan-400/30 bg-[#050d1f]"
                        : "border-white/10 bg-[#050c1c] hover:border-cyan-400/20",
                    ].join(" ")}
                  >

                    {/* COLLAPSED HEADER */}

                    <button
                      type="button"
                      onClick={() =>
                        toggleCard(card.id)
                      }
                      className="grid w-full items-center gap-4 p-4 text-start sm:grid-cols-[auto_minmax(180px,1.5fr)_auto_auto_auto_auto]"
                    >

                      <span
                        className={[
                          "w-fit whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-black",
                          statusClasses(
                            card.status,
                          ),
                        ].join(" ")}
                      >
                        {statusLabel(
                          card.status,
                        )}
                      </span>


                      <div className="min-w-0">

                        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-cyan-400">
                          {card.card_number}
                        </p>

                        <p className="mt-1 truncate text-base font-black text-white">
                          {card.title ??
                            `${card.items_count} ${text.predictions}`}
                        </p>

                      </div>


                      <div className="hidden text-xs text-white/65 sm:block">
                        📅{" "}
                        {formatDate(
                          card.created_at,
                          locale,
                        )}
                      </div>


                      <div className="text-xs font-black text-white">
                        {card.items_count}{" "}
                        {text.predictions}
                      </div>


                      <div className="text-xs text-white/65">
                        {text.evaluated}:{" "}
                        <strong className="text-white">
                          {card.resolved_count}/
                          {card.items_count}
                        </strong>
                      </div>


                      <div className="flex items-center justify-end gap-3">

                        <span
                          className={[
                            "hidden rounded-full border px-3 py-1 text-[11px] font-black md:inline-flex",
                            card.resolved_count > 0
                              ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300"
                              : "border-white/10 bg-white/[0.03] text-white/50",
                          ].join(" ")}
                        >
                          {card.resolved_count > 0
                            ? `${text.success}: ${successRate(card)}`
                            : "—"}
                        </span>


                        <span
                          className={[
                            "text-xl text-white/80 transition-transform duration-200",
                            open
                              ? "rotate-180"
                              : "",
                          ].join(" ")}
                        >
                          ⌄
                        </span>

                      </div>

                    </button>

                    <div className="flex justify-end border-t border-white/5 px-4 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteCard(card.id)
                        }
                        disabled={
                          deletingCardId === card.id
                        }
                        aria-label={
                          locale === "ar"
                            ? "حذف البطاقة"
                            : locale === "sv"
                              ? "Ta bort kort"
                              : "Delete card"
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.07] px-3 py-1.5 text-xs font-black text-rose-400 transition hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span aria-hidden="true">
                          {deletingCardId === card.id
                            ? "…"
                            : "🗑"}
                        </span>

                        <span>
                          {deletingCardId === card.id
                            ? locale === "ar"
                              ? "جارٍ الحذف..."
                              : locale === "sv"
                                ? "Tar bort..."
                                : "Deleting..."
                            : locale === "ar"
                              ? "حذف"
                              : locale === "sv"
                                ? "Ta bort"
                                : "Delete"}
                        </span>
                      </button>
                    </div>


                    {/* EXPANDED CONTENT */}

                    {open && (

                      <div className="border-t border-white/10">

                        <div className="grid gap-2 border-b border-white/10 bg-white/[0.02] px-5 py-3 text-xs sm:grid-cols-3">

                          <div className="font-bold text-white/65">
                            ✓ {card.won_count}{" "}
                            {text.correct}
                          </div>

                          <div className="font-bold text-white/65">
                            ✕ {card.lost_count}{" "}
                            {text.wrong}
                          </div>

                          <div className="font-bold text-white/65">
                            {text.success}:{" "}
                            <span className="text-cyan-300">
                              {successRate(card)}
                            </span>
                          </div>

                        </div>


                        <div className="divide-y divide-white/5">

                          {card.items.map(
                            (
                              item,
                              index,
                            ) => {
                              const state =
                                itemStatus(item);

                              return (
                                <div
                                  key={item.id}
                                  className="grid gap-3 px-4 py-3 sm:grid-cols-[36px_minmax(0,1fr)] lg:mx-auto lg:flex lg:w-full lg:max-w-[820px] lg:items-center lg:gap-4"
                                >
                                  <div className="flex h-8 w-8 items-center justify-center self-start rounded-lg border border-white/10 bg-white/5 text-xs font-black text-white/65 lg:self-center">
                                    {index + 1}
                                  </div>

                                  <div className="min-w-0 lg:flex-1">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                      <p
                                        className="truncate text-sm font-black text-white"
                                        dir="ltr"
                                      >
                                        {matchName(item)}
                                      </p>

                                      {item.match_date && (
                                        <span className="shrink-0 text-xs font-semibold text-slate-400" dir="ltr">
                                          {(() => { const d = new Date(item.match_date); const date = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(d); const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(d); return <>📅 <bdi>{date}</bdi> <span className="text-slate-600">•</span> <bdi>{time}</bdi></>; })()}
                                        </span>
                                      )}

                                      {item.home_score != null &&
                                        item.away_score != null && (
                                          <span
                                            className="shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-black text-white"
                                            dir="ltr"
                                          >
                                            {item.home_score}
                                            {" - "}
                                            {item.away_score}
                                          </span>
                                        )}
                                    </div>

                                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                                      <span className="text-white/50">
                                        {marketLabel(item)}
                                      </span>

                                      <span className="text-slate-700">•</span>

                                      <span className="font-bold text-white/80">
                                        {selectionLabel(item)}
                                      </span>
                                    </div>

                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                                      <span className="font-bold text-cyan-300">
                                        {text.probability}:{" "}
                                        {percentage(item.probability)}
                                      </span>

                                      <span className="font-bold text-cyan-300">
                                        {text.confidence}:{" "}
                                        {percentage(item.confidence)}
                                      </span>

                                      {item.decimal_odds !== null && (
                                        <span className="font-bold text-emerald-300">
                                          Odds: <bdi>{item.decimal_odds.toFixed(2)}</bdi>
                                          {item.bookmaker_name && (
                                            <> · <bdi>{item.bookmaker_name}</bdi></>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="col-start-2 flex items-center justify-start lg:col-start-auto lg:ml-2 lg:shrink-0">
                                    <span
                                      className={[
                                        "whitespace-nowrap rounded-lg border px-3 py-1.5 text-[11px] font-black",
                                        state.classes,
                                      ].join(" ")}
                                    >
                                      {state.label}
                                    </span>
                                  </div>
                                </div>
                              );
                            },
                          )}

                        </div>

                      </div>
                    )}

                  </article>
                );
              })}

            </div>
          )}


          {!loading &&
            cards.length > 0 && (

              <p className="mt-5 text-center text-xs text-white/50">
                ⓘ {text.openHint}
              </p>

            )}

        </section>

      </div>
    </main>
  );
}
