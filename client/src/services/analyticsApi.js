import api from "./api";

export async function getDashboardAnalytics() {
  const { data } = await api.get("/analytics/dashboard");
  return data;
}

export async function getOverallAnalytics() {
  const { data } = await api.get("/analytics/overall");
  return data;
}

export async function getLeagueAnalytics() {
  const { data } = await api.get("/analytics/leagues");
  return data;
}

export async function getMarketAnalytics() {
  const { data } = await api.get("/analytics/markets");
  return data;
}

export async function getConfidenceAnalytics() {
  const { data } = await api.get("/analytics/confidence");
  return data;
}

export async function getStatusAnalytics() {
  const { data } = await api.get("/analytics/status");
  return data;
}

export async function getTimeAnalytics() {
  const { data } = await api.get("/analytics/time");
  return data;
}