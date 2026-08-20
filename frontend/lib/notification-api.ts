export type NotificationItem = {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  link: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type UnreadCountResponse = {
  unread_count: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

async function notificationRequest<T>(
  path: string,
  accessToken: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(options?.headers || {}),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Notification API request failed: ${response.status}`,
    );
  }

  return (await response.json()) as T;
}

export function getNotifications(
  accessToken: string,
): Promise<NotificationItem[]> {
  return notificationRequest<NotificationItem[]>(
    "/notifications",
    accessToken,
  );
}

export function getUnreadNotificationCount(
  accessToken: string,
): Promise<UnreadCountResponse> {
  return notificationRequest<UnreadCountResponse>(
    "/notifications/unread-count",
    accessToken,
  );
}

export function markNotificationRead(
  accessToken: string,
  notificationId: number,
): Promise<NotificationItem> {
  return notificationRequest<NotificationItem>(
    `/notifications/${notificationId}/read`,
    accessToken,
    {
      method: "POST",
    },
  );
}

export function markAllNotificationsRead(
  accessToken: string,
): Promise<unknown> {
  return notificationRequest<unknown>(
    "/notifications/read-all",
    accessToken,
    {
      method: "POST",
    },
  );
}
