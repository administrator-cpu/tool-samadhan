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

async function apiFetch(endpoint: string, options: ApiOptions = {}) {
  const { setAuth, clearAuth } = useAuthStore.getState();
  
  // 1. Helper to perform a refresh
  const performRefresh = async () => {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const res = await fetch(`${API_URL}/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          
          if (!res.ok) return null;
          
          const data = await res.json();
          return data;
        } catch (e) {
          console.error("[API] Refresh fetch failed:", e);
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
    }
    return refreshPromise;
  };

  // 2. Ensure we have a token if we think we're authenticated
  let accessToken = useAuthStore.getState().accessToken;
  const isAuthenticated = useAuthStore.getState().isAuthenticated;

  if (!accessToken && isAuthenticated && !["/refresh", "/login", "/register"].includes(endpoint)) {
    const refreshData = await performRefresh();
    if (refreshData) {
      console.log("[API] Refresh data:", refreshData);
      accessToken = refreshData.data.accessToken;
      if (accessToken) {
        setAuth(refreshData.data.user, accessToken);
      }
    } else {
      clearAuth();
      throw new ApiError("Session expired", 401, "SESSION_EXPIRED");
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
    console.log(`[API] Fetching ${endpoint} with token: ${accessToken?.substring(0, 10)}...`);
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
    const freshAccessToken = useAuthStore.getState().accessToken;
    
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
        const retryToken = useAuthStore.getState().accessToken;
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
          setAuth(refreshData.data.user, newAccessToken);
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
        }
        
        throw new ApiError("Session expired", 401, "SESSION_EXPIRED");
      }
    }
  }

  // 6. Handle response data
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
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
};
