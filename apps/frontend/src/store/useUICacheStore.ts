import { create } from "zustand";

interface UICacheState {
  profileData: any | null;
  profileLastFetched: number | null;
  agentsList: any[] | null;
  agentsLastFetched: number | null;
  dashboardStats: any | null;
  dashboardLastFetched: number | null;
  setProfileData: (data: any) => void;
  setAgentsList: (agents: any[]) => void;
  setDashboardStats: (stats: any) => void;
  clearCache: () => void;
}

export const useUICacheStore = create<UICacheState>((set) => ({
  profileData: null,
  profileLastFetched: null,
  agentsList: null,
  agentsLastFetched: null,
  dashboardStats: null,
  dashboardLastFetched: null,
  setProfileData: (data) =>
    set({
      profileData: data,
      profileLastFetched: Date.now(),
    }),
  setAgentsList: (agents) =>
    set({
      agentsList: agents,
      agentsLastFetched: Date.now(),
    }),
  setDashboardStats: (stats) =>
    set({
      dashboardStats: stats,
      dashboardLastFetched: Date.now(),
    }),
  clearCache: () =>
    set({
      profileData: null,
      profileLastFetched: null,
      agentsList: null,
      agentsLastFetched: null,
      dashboardStats: null,
      dashboardLastFetched: null,
    }),
}));
