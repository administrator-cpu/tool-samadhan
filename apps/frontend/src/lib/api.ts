import { useAuthStore } from "@/store/useAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface ApiOptions extends RequestInit {
  body?: any;
}

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

let refreshPromise: Promise<any> | null = null;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const refreshToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      let lastNetworkError: unknown = null;

      try {
        const storedRefreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

        for (let attempt = 1; attempt <= 2; attempt += 1) {
          try {
            console.log("[API] Attempting background token refresh...");
            const res = await fetch(`${API_URL}/refresh`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                ...(storedRefreshToken ? { "X-Refresh-Token": storedRefreshToken } : {})
              },
              credentials: "include",
              body: storedRefreshToken ? JSON.stringify({ refreshToken: storedRefreshToken }) : undefined,
            });

            if (res.status === 401 || res.status === 403) {
              return null;
            }

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
              throw new ApiError(
                data.message || "Unable to refresh session. Please try again.",
                res.status,
                data.code,
                data.details,
              );
            }

            if (data?.data?.accessToken) {
              useAuthStore.getState().setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
            }

            return data;
          } catch (error) {
            if (error instanceof ApiError) {
              throw error;
            }

            lastNetworkError = error;

            if (attempt === 1) {
              console.warn("[API] Refresh network failed. Retrying once...");
              await wait(500);
              continue;
            }
          }
        }

        throw new ApiError(
          "Network error while refreshing session. Please check your connection.",
          0,
          "NETWORK_ERROR",
          lastNetworkError,
        );
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

async function apiFetch(endpoint: string, options: ApiOptions = {}) {
  const { setAuth, clearAuth } = useAuthStore.getState();
  
  // 1. Helper to perform a refresh
  const performRefresh = refreshToken;

  // 2. Prevent requests if unauthenticated (except public routes)
  const publicRoutes = ["/login", "/register", "/refresh", "/forgot-password", "/verify-otp", "/reset-password", "/logout"];
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  let accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  if (!isAuthenticated && !publicRoutes.includes(endpoint)) {
    console.warn(`[API] Blocked ${endpoint} while unauthenticated.`);
    return { data: {}, _isSilent: true } as any;
  }

  // 3. Ensure we have a token if we think we're authenticated
  if (!accessToken && isAuthenticated && !publicRoutes.includes(endpoint)) {
    const refreshData = await performRefresh();
    if (refreshData) {
      console.log("[API] Refresh data successful");
      accessToken = refreshData.data.accessToken;
      if (accessToken) {
        setAuth(refreshData.data.user, accessToken, refreshData.data.refreshToken);
      }
    } else {
      const stillAuthenticated = useAuthStore.getState().isAuthenticated;
      clearAuth();
      if (stillAuthenticated && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth-session-expired"));
        throw new ApiError("Session expired", 401, "SESSION_EXPIRED");
      } else {
        // Return a silent object instead of throwing
        return { data: {}, _isSilent: true } as any;
      }
    }
  }

  // 3. Prepare request
  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.body);
  }

  // 4. First attempt
  let response;
  try {
    console.log(`[API] Fetching ${endpoint}`);
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (error) {
    console.log(error);
    throw new ApiError("Network error. Please check your connection.", 0, "NETWORK_ERROR");
  }

  // 5. Handle 401 (Expired token)
  if (response.status === 401 && !["/refresh", "/login", "/register"].includes(endpoint)) {
    console.log(`[API] 401 Unauthorized for ${endpoint}. Attempting refresh...`);
    const freshAccessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    
    // Check if another concurrent request already refreshed it
    if (freshAccessToken && freshAccessToken !== accessToken) {
      console.log(`[API] Using fresh token from concurrent refresh for ${endpoint}`);
      headers.set("Authorization", `Bearer ${freshAccessToken}`);
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
      });
    } else {
      // Cooldown check: if we just refreshed < 2s ago, don't refresh again immediately
      const now = Date.now();
      const lastRefresh = (window as any)._lastRefreshAt || 0;
      
      if (now - lastRefresh < 2000) {
        console.log(`[API] Refresh cooldown active for ${endpoint}. Waiting...`);
        await new Promise(r => setTimeout(r, 500));
        const retryToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (retryToken && retryToken !== accessToken) {
           headers.set("Authorization", `Bearer ${retryToken}`);
           return fetch(`${API_URL}${endpoint}`, { ...options, headers, credentials: "include" }).then(r => r.json());
        }
      }

      const refreshData = await performRefresh();
      if (refreshData) {
        (window as any)._lastRefreshAt = Date.now();
        console.log(`[API] Refresh successful. Retrying ${endpoint}`);
        const newAccessToken = refreshData.data.accessToken;
        if (newAccessToken) {
          setAuth(refreshData.data.user, newAccessToken, refreshData.data.refreshToken);
          accessToken = newAccessToken; // Update current accessToken for the retry
        }
        
        headers.set("Authorization", `Bearer ${newAccessToken}`);
        response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
          credentials: "include",
        });
      } else {
        console.log(`[API] Refresh failed for ${endpoint}.`);
        
        const stillAuthenticated = useAuthStore.getState().isAuthenticated;
        
        clearAuth();
        
        // Only trigger session expired event if the user was supposedly logged in
        if (stillAuthenticated && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth-session-expired"));
          throw new ApiError("Session expired", 401, "SESSION_EXPIRED");
        } else {
          // Return a silent object instead of throwing to avoid console noise
          return { data: {}, _isSilent: true } as any;
        }
      }
    }
  }

  // 6. Handle response data
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const stillAuth = useAuthStore.getState().isAuthenticated;
    if (!stillAuth && response.status === 401 && !publicRoutes.includes(endpoint)) {
      return { data: {}, _isSilent: true } as any;
    }

    let message = data.message || "An unexpected error occurred";
    if (response.status >= 500) {
      message = "Something went wrong on our end. Please try again later.";
    }
    throw new ApiError(message, response.status, data.code, data.details);
  }

  return data;
}

export const api = {
  get: (endpoint: string, options?: ApiOptions) =>
    apiFetch(endpoint, { ...options, method: "GET" }),
  post: (endpoint: string, body?: any, options?: ApiOptions) =>
    apiFetch(endpoint, { ...options, method: "POST", body }),
  put: (endpoint: string, body?: any, options?: ApiOptions) =>
    apiFetch(endpoint, { ...options, method: "PUT", body }),
  delete: (endpoint: string, options?: ApiOptions) =>
    apiFetch(endpoint, { ...options, method: "DELETE" }),
  patch: (endpoint: string, body?: any, options?: ApiOptions) =>
    apiFetch(endpoint, { ...options, method: "PATCH", body }),
  refresh: refreshToken,
};
