
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  getProfile,
  getDashboardStats,
  getRecentPredictions,
  getFavorites,
} from "../api/dashboardApi.js";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalPredictions: 0,
    freePredictions: 0,
    premiumPredictions: 0,
    averageConfidence: 0,
    accuracy: 0,
    todayPredictions: 0,
    completedPredictions: 0,
    pendingPredictions: 0,
  });

  const [recentPredictions, setRecentPredictions] =
    useState([]);

  const [favorites, setFavorites] = useState([]);

  const fetchDashboardData = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          profileData,
          statsData,
          predictionsData,
          favoritesData,
        ] = await Promise.all([
          getProfile(),
          getDashboardStats(),
          getRecentPredictions(10),
          getFavorites(),
        ]);

        setProfile(profileData);
        setStats(
          statsData || {
            totalPredictions: 0,
            freePredictions: 0,
            premiumPredictions: 0,
            averageConfidence: 0,
            accuracy: 0,
            todayPredictions: 0,
            completedPredictions: 0,
            pendingPredictions: 0,
          }
        );

        setRecentPredictions(
          Array.isArray(predictionsData)
            ? predictionsData
            : []
        );

        setFavorites(
          Array.isArray(favoritesData)
            ? favoritesData
            : []
        );
      } catch (err) {
        console.error(
          "Dashboard data error:",
          err
        );

        setError(
          err.message ||
            "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <DashboardContext.Provider
      value={{
        loading,
        error,
        profile,
        stats,
        recentPredictions,
        favorites,
        refreshDashboard:
          fetchDashboardData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context =
    useContext(DashboardContext);

  if (!context) {
    throw new Error(
      "useDashboard must be used within a DashboardProvider"
    );
  }

  return context;
}

