
import API_BASE_URL from "../config/api.js";

function getToken() {
  return localStorage.getItem("token");
}

function getAuthHeaders(includeJson = true) {
  const headers = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function request(endpoint, options = {}) {
  const method = options.method || "GET";

  const config = {
    method,
    headers: getAuthHeaders(
      options.body !== undefined
    ),
  };

  if (options.body !== undefined) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    config
  );

  const contentType =
    response.headers.get("content-type") || "";

  let result;

  if (contentType.includes("application/json")) {
    result = await response.json();
  } else {
    result = {
      message: await response.text(),
    };
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        `Request failed with status ${response.status}`
    );
  }

  return result;
}

// ==========================================
// Dashboard Statistics
// ==========================================

export async function getDashboardStats() {
  const result =
    await request("/dashboard/stats");

  return result.stats || {};
}

// ==========================================
// Recent Predictions
// ==========================================

export async function getRecentPredictions(
  limit = 10
) {
  const result = await request(
    `/dashboard/recent-predictions?limit=${limit}`
  );

  return result.predictions || [];
}

// ==========================================
// Profile
// ==========================================

export async function getProfile() {
  const result =
    await request("/dashboard/profile");

  return result.profile || null;
}

// ==========================================
// Favorites
// ==========================================

export async function getFavorites() {
  const result =
    await request("/dashboard/favorites");

  return result.favorites || [];
}

// ==========================================
// Live Matches
// ==========================================

export async function getLiveMatches() {
  const result =
    await request("/matches");

  return result.matches || [];
}

