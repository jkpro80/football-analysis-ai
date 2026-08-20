"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  login as loginRequest,
  me as meRequest,
  refresh as refreshRequest,
  register as registerRequest,
  type LoginRequest,
  type RegisterRequest,
  type User,
} from "@/lib/auth-api";
const ACCESS_TOKEN_KEY = "football_ai_access_token";
const REFRESH_TOKEN_KEY = "football_ai_refresh_token";
interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    payload: LoginRequest,
  ) => Promise<User>;
  register: (
    payload: RegisterRequest,
  ) => Promise<User>;
  logout: () => void;
  refreshSession: () => Promise<User | null>;
  reloadUser: () => Promise<User | null>;
}
const AuthContext =
  createContext<AuthContextValue | null>(null);
function readStoredToken(
  key: string,
): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(key);
}
function storeTokens(
  accessToken: string,
  refreshToken: string,
): void {
  window.localStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken,
  );
  window.localStorage.setItem(
    REFRESH_TOKEN_KEY,
    refreshToken,
  );

  document.cookie =
    `${ACCESS_TOKEN_KEY}=${encodeURIComponent(accessToken)}; Path=/; SameSite=Lax`;
}
function clearStoredTokens(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(
    ACCESS_TOKEN_KEY,
  );
  window.localStorage.removeItem(
    REFRESH_TOKEN_KEY,
  );

  document.cookie =
    `${ACCESS_TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}
export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);
  const [accessToken, setAccessToken] =
    useState<string | null>(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const logout = useCallback(() => {
    clearStoredTokens();
    setAccessToken(null);
    setUser(null);
  }, []);
  const refreshSession = useCallback(
    async (): Promise<User | null> => {
      const accessToken =
        readStoredToken(
          ACCESS_TOKEN_KEY,
        );
      const refreshToken =
        readStoredToken(
          REFRESH_TOKEN_KEY,
        );
      if (!accessToken && !refreshToken) {
        setUser(null);
        return null;
      }
      if (accessToken) {
        try {
          const currentUser =
            await meRequest(
              accessToken,
            );
          setAccessToken(accessToken);
        setUser(currentUser);
          return currentUser;
        } catch {
          // Try refresh token below.
        }
      }
      if (!refreshToken) {
        logout();
        return null;
      }
      try {
        const response =
          await refreshRequest(
            refreshToken,
          );
        storeTokens(
          response.access_token,
          response.refresh_token,
        );
        setAccessToken(response.access_token);
      setUser(response.user);
        return response.user;
      } catch {
        logout();
        return null;
      }
    },
    [logout],
  );
  const reloadUser = useCallback(
    async (): Promise<User | null> => {
      const accessToken =
        readStoredToken(
          ACCESS_TOKEN_KEY,
        );
      if (!accessToken) {
        return refreshSession();
      }
      try {
        const currentUser =
          await meRequest(
            accessToken,
          );
        setAccessToken(accessToken);
        setUser(currentUser);
        return currentUser;
      } catch {
        return refreshSession();
      }
    },
    [refreshSession],
  );
  const login = useCallback(
    async (
      payload: LoginRequest,
    ): Promise<User> => {
      const response =
        await loginRequest(
          payload,
        );
      storeTokens(
        response.access_token,
        response.refresh_token,
      );
      setAccessToken(response.access_token);
      setUser(response.user);
      return response.user;
    },
    [],
  );
  const register = useCallback(
    async (
      payload: RegisterRequest,
    ): Promise<User> => {
      const createdUser =
        await registerRequest(
          payload,
        );
      await login({
        identifier: payload.email,
        password: payload.password,
      });
      return createdUser;
    },
    [login],
  );
  useEffect(() => {
    let mounted = true;
    async function initializeSession() {
      try {
        await refreshSession();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    initializeSession();
    return () => {
      mounted = false;
    };
  }, [refreshSession]);
  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,
        accessToken,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
        refreshSession,
        reloadUser,
      }),
      [
        user,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        refreshSession,
        reloadUser,
      ],
    );
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth(): AuthContextValue {
  const context =
    useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    );
  }
  return context;
}






