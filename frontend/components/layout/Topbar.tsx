"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import type { Locale } from "@/lib/i18n/config";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/notification-api";

export default function Topbar() {
  const router = useRouter();

  const {
    locale,
    messages,
    setLocale,
  } = useLocale();

  const {
    user,
    accessToken,
    isLoading,
    isAuthenticated,
  } = useAuth();

  const [isNotificationsOpen, setIsNotificationsOpen] =
    useState(false);

  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [isNotificationsLoading, setIsNotificationsLoading] =
    useState(false);

  const notificationBoxRef =
    useRef<HTMLDivElement | null>(null);

  const displayName =
    user?.full_name?.trim() ||
    user?.username?.trim() ||
    (
      locale === "ar"
        ? "المستخدم"
        : locale === "sv"
          ? "Användare"
          : "User"
    );

  const initial =
    displayName.charAt(0).toUpperCase() || "U";

  const isAdmin = user?.role === "admin";

  const accountLabel = isAdmin
    ? (
        locale === "ar"
          ? "مدير النظام"
          : locale === "sv"
            ? "Administratör"
            : "Administrator"
      )
    : user?.subscription?.plan?.name
      ? (
          locale === "ar"
            ? `حساب ${user.subscription.plan.name}`
            : locale === "sv"
              ? `${user.subscription.plan.name}-konto`
              : `${user.subscription.plan.name} Account`
        )
      : (
          locale === "ar"
            ? "حساب مجاني"
            : locale === "sv"
              ? "Gratiskonto"
              : "Free Account"
        );

  const loadUnreadCount = useCallback(async () => {
    if (!accessToken || !isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const result =
        await getUnreadNotificationCount(
          accessToken,
        );

      setUnreadCount(result.unread_count);
    } catch {
      // Keep topbar usable if notifications fail.
    }
  }, [accessToken, isAuthenticated]);

  const loadNotifications = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsNotificationsLoading(true);

    try {
      const result =
        await getNotifications(accessToken);

      setNotifications(result);
    } catch {
      setNotifications([]);
    } finally {
      setIsNotificationsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadUnreadCount();
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }

    void loadNotifications();
  }, [
    isNotificationsOpen,
    loadNotifications,
  ]);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        notificationBoxRef.current &&
        !notificationBoxRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  async function handleNotificationClick(
    notification: NotificationItem,
  ) {
    if (!accessToken) {
      return;
    }

    if (!notification.is_read) {
      try {
        await markNotificationRead(
          accessToken,
          notification.id,
        );

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  is_read: true,
                  read_at:
                    new Date().toISOString(),
                }
              : item,
          ),
        );

        setUnreadCount((current) =>
          Math.max(0, current - 1),
        );
      } catch {
        return;
      }
    }

    setIsNotificationsOpen(false);

    if (notification.link) {
      router.push(notification.link);
    }
  }

  async function handleMarkAllRead() {
    if (!accessToken || unreadCount === 0) {
      return;
    }

    try {
      await markAllNotificationsRead(
        accessToken,
      );

      const readAt = new Date().toISOString();

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || readAt,
        })),
      );

      setUnreadCount(0);
    } catch {
      // Keep current UI state on failure.
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="max-w-xl flex-1">
          <input
            type="text"
            placeholder={
              locale === "ar"
                ? "ابحث عن فريق، دوري أو مباراة..."
                : locale === "sv"
                  ? "Sök efter lag, liga eller match..."
                  : "Search for a team, league or match..."
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white outline-none transition focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <label
              htmlFor="language-switcher"
              className="sr-only"
            >
              Language
            </label>

            <select
              id="language-switcher"
              value={locale}
              onChange={(event) =>
                setLocale(
                  event.target.value as Locale,
                )
              }
              className="cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-200 outline-none transition hover:border-slate-600 focus:border-cyan-500"
              aria-label="Language"
            >
              <option value="ar">
                العربية
              </option>

              <option value="en">
                English
              </option>

              <option value="sv">
                Svenska
              </option>
            </select>
          </div>

          {isAuthenticated && (
            <div
              ref={notificationBoxRef}
              className="relative"
            >
              <button
                type="button"
                aria-label={locale === "ar" ? "الإشعارات" : locale === "sv" ? "Aviseringar" : "Notifications"}
                title={locale === "ar" ? "الإشعارات" : locale === "sv" ? "Aviseringar" : "Notifications"}
                onClick={() =>
                  setIsNotificationsOpen(
                    (current) => !current,
                  )
                }
                className="relative rounded-xl bg-slate-900 p-3 transition hover:bg-slate-800"
              >
                <span aria-hidden="true">
                  🔔
                </span>

                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                ) : null}
              </button>

              {isNotificationsOpen ? (
                <div
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  className="absolute left-0 top-14 z-50 w-[360px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                    <div>
                      <p className="font-black text-white">
                        الإشعارات
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {unreadCount > 0
                          ? `${unreadCount} غير مقروء`
                          : "لا توجد إشعارات غير مقروءة"}
                      </p>
                    </div>

                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          void handleMarkAllRead()
                        }
                        className="text-xs font-bold text-cyan-400 transition hover:text-cyan-300"
                      >
                        تعليم الكل كمقروء
                      </button>
                    ) : null}
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">
                    {isNotificationsLoading ? (
                      <div className="p-6 text-center text-sm text-slate-400">
                        جارٍ تحميل الإشعارات...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="text-3xl">
                          🔔
                        </div>
                        <p className="mt-3 font-bold text-white">
                          لا توجد إشعارات
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          ستظهر التنبيهات الجديدة هنا.
                        </p>
                      </div>
                    ) : (
                      notifications.map(
                        (notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() =>
                              void handleNotificationClick(
                                notification,
                              )
                            }
                            className={`block w-full border-b border-slate-800 px-4 py-4 ${locale === "ar" ? "text-right" : "text-left"} transition last:border-b-0 hover:bg-slate-900 ${
                              notification.is_read
                                ? "bg-slate-950"
                                : "bg-cyan-500/5"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                                  notification.is_read
                                    ? "bg-slate-700"
                                    : "bg-cyan-400"
                                }`}
                              />

                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-white">
                                  {
                                    notification.title
                                  }
                                </p>

                                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">
                                  {
                                    notification.message
                                  }
                                </p>

                                <p className="mt-2 text-[11px] text-slate-500">
                                  {new Date(
                                    notification.created_at,
                                  ).toLocaleString(
                                    "ar-IQ",
                                  )}
                                </p>
                              </div>
                            </div>
                          </button>
                        ),
                      )
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {isLoading ? (
            <div className="h-12 w-44 animate-pulse rounded-xl bg-slate-900" />
          ) : isAuthenticated && user ? (
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-xl bg-slate-900 px-3 py-2 transition hover:bg-slate-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 font-bold text-slate-950">
                {initial}
              </div>

              <div className="hidden text-right lg:block">
                <p className="max-w-40 truncate text-sm font-bold text-white">
                  {displayName}
                </p>

                <p className="text-xs text-slate-400">
                  {accountLabel}
                </p>
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              {messages.common.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}