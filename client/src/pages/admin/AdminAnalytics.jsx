import { useEffect, useState } from "react";
import { getDashboardAnalytics } from "../../services/analyticsApi";

import OverviewCards from "../../components/analytics/OverviewCards";
import AccuracyChart from "../../components/analytics/AccuracyChart";
import LeagueTable from "../../components/analytics/LeagueTable";
import MarketTable from "../../components/analytics/MarketTable";
import ConfidenceTable from "../../components/analytics/ConfidenceTable";
import AIInsights from "../../components/analytics/AIInsights";
import PredictionStatusTable from "../../components/analytics/PredictionStatusTable";

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const data = await getDashboardAnalytics();

      setDashboard(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load analytics dashboard.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        <h2>Loading AI Analytics...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        <h2>{error}</h2>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        <h2>No analytics data available.</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 30,
      }}
    >
      <h1>AI Analytics Dashboard</h1>

      <p>
        Monitor prediction performance,
        AI learning and overall system
        health.
      </p>

      <OverviewCards
        overview={{
          totalPredictions:
            dashboard.overview?.totalPredictions ?? 0,

          validatedPredictions:
            (dashboard.overview?.totalWins ?? 0) +
            (dashboard.overview?.totalLosses ?? 0),

          engineVersion: "v4.0.0",
        }}
        performance={{
          accuracy:
            dashboard.overview?.overallAccuracy ?? 0,

          averageConfidence:
            dashboard.bestConfidenceBand?.accuracy ?? 0,

          bestLeague:
            dashboard.bestLeague?.league ?? "--",
        }}
      />

      <AccuracyChart
        data={dashboard.charts?.timeline ?? []}
      />

      <div
        style={{
          marginTop: 30,
        }}
      >
        <LeagueTable
          leagues={dashboard.charts?.leagues ?? []}
        />
      </div>

      <div
        style={{
          marginTop: 30,
        }}
      >
        <MarketTable
          markets={dashboard.charts?.markets ?? []}
        />
      </div>

      <div
        style={{
          marginTop: 30,
        }}
      >
        <ConfidenceTable
          confidenceBands={
            dashboard.charts?.confidence ?? []
          }
        />
      </div>

      <div
        style={{
          marginTop: 30,
        }}
      >
        <AIInsights
          bestLeague={dashboard.bestLeague}
          bestMarket={dashboard.bestMarket}
          confidenceBand={
            dashboard.bestConfidenceBand
          }
        />
      </div>

      <div
        style={{
          marginTop: 30,
        }}
      >
        <PredictionStatusTable
          statusData={
            dashboard.charts?.status ?? []
          }
        />
      </div>
    </div>
  );
}