import {
  getOverallAnalytics,
  getLeagueAnalytics,
  getMarketAnalytics,
  getConfidenceAnalytics,
  getStatusAnalytics,
  getTimeAnalytics,
  getDashboardSummary,
} from "../services/analyticsService.js";

export async function overallAnalytics(req, res) {
  try {
    const data = await getOverallAnalytics();
    res.status(200).json(data);
  } catch (error) {
    console.error("Overall Analytics Error:", error);
    res.status(500).json({
      message: "Failed to load overall analytics",
    });
  }
}

export async function leagueAnalytics(req, res) {
  try {
    const data = await getLeagueAnalytics();
    res.status(200).json(data);
  } catch (error) {
    console.error("League Analytics Error:", error);
    res.status(500).json({
      message: "Failed to load league analytics",
    });
  }
}

export async function marketAnalytics(req, res) {
  try {
    const data = await getMarketAnalytics();
    res.status(200).json(data);
  } catch (error) {
    console.error("Market Analytics Error:", error);
    res.status(500).json({
      message: "Failed to load market analytics",
    });
  }
}

export async function confidenceAnalytics(req, res) {
  try {
    const data = await getConfidenceAnalytics();
    res.status(200).json(data);
  } catch (error) {
    console.error("Confidence Analytics Error:", error);
    res.status(500).json({
      message: "Failed to load confidence analytics",
    });
  }
}

export async function statusAnalytics(req, res) {
  try {
    const data = await getStatusAnalytics();
    res.status(200).json(data);
  } catch (error) {
    console.error("Status Analytics Error:", error);
    res.status(500).json({
      message: "Failed to load status analytics",
    });
  }
}

export async function timeAnalytics(req, res) {
  try {
    const data = await getTimeAnalytics();
    res.status(200).json(data);
  } catch (error) {
    console.error("Time Analytics Error:", error);
    res.status(500).json({
      message: "Failed to load time analytics",
    });
  }
}

export async function dashboardAnalytics(req, res) {
  try {
    const data = await getDashboardSummary();
    res.status(200).json(data);
  } catch (error) {
    console.error("Dashboard Analytics Error:", error);
    res.status(500).json({
      message: "Failed to load dashboard analytics",
    });
  }
}