const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";
export interface RegisterRequest {
  full_name: string;
  username: string;
  email: string;
  password: string;
  accepted_legal: boolean;

}
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface MessageResponse {
  message: string;
}
export interface SubscriptionPlan {
  id: number;
  code: string;
  name: string;
  description: string | null;
  monthly_price: number;
  currency: string;
  analysis_limit: number | null;
  is_active: boolean;
}
export interface UserSubscription {
  id: number;
  status: string;
  starts_at: string;
  ends_at: string | null;
  auto_renew: boolean;
  plan: SubscriptionPlan;
}
export interface SubscriptionUsage {
  plan: string;
  analysis_limit: number | null;
  used: number;
  remaining: number | null;
  reset_at: string;
}
export interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  subscription?: UserSubscription | null;
}
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}
async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body?.detail)) {
        const validationMessages = body.detail
          .map((item: unknown) => {
            if (
              typeof item === "object" &&
              item !== null &&
              "msg" in item &&
              typeof (item as { msg?: unknown }).msg === "string"
            ) {
              return (item as { msg: string }).msg;
            }

            return null;
          })
          .filter((item: string | null): item is string => Boolean(item));

        if (validationMessages.length > 0) {
          message = validationMessages.join(" ");
        }
      }
    } catch {
      // Keep generic error.
    }
    throw new Error(message);
  }
  return response.json();
}
export function register(
  payload: RegisterRequest,
) {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function login(
  payload: LoginRequest,
) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function forgotPassword(
  payload: ForgotPasswordRequest,
) {
  return request<MessageResponse>(
    "/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function resetPassword(
  payload: ResetPasswordRequest,
) {
  return request<MessageResponse>(
    "/auth/reset-password",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
export function refresh(
  refresh_token: string,
) {
  return request<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({
      refresh_token,
    }),
  });
}
export function me(
  accessToken: string,
) {
  return request<User>("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
export function getSubscriptionPlans() {
  return request<SubscriptionPlan[]>(
    "/subscriptions/plans",
  );
}
export function getMySubscription(
  accessToken: string,
) {
  return request<UserSubscription | null>(
    "/subscriptions/me",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}
export function changeSubscription(
  accessToken: string,
  planCode: string,
) {
  return request<UserSubscription>(
    "/subscriptions/change",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        plan_code: planCode,
      }),
    },
  );
}
export function getSubscriptionUsage(
  accessToken: string,
) {
  return request<SubscriptionUsage>(
    "/subscriptions/usage",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}



export interface CheckoutResponse {
  payment_id: number;
  provider: string;
  checkout_url: string;
}

export interface PaymentReconcileResponse {
  payment_id: number;
  status: string;
  provider_subscription_id: string | null;
}
export function reconcilePayment(
  accessToken: string,
  paymentId: number,
) {
  return request<PaymentReconcileResponse>(
    `/payments/${paymentId}/reconcile`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}
export function cancelSubscription(
  accessToken: string,
) {
  return request<UserSubscription>(
    "/subscriptions/cancel",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}
export function createCheckout(
  accessToken: string,
  planCode: string,
  successUrl: string,
  cancelUrl: string,
  acceptedSubscriptionTerms: boolean,

) {
  return request<CheckoutResponse>(
    "/payments/checkout",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        plan_code: planCode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        accepted_subscription_terms:
          acceptedSubscriptionTerms,

      }),
    },
  );
}







