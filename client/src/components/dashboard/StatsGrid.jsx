import "./Dashboard.css";
import StatsCard from "./StatsCard";
import { useDashboard } from "../../context/DashboardContext";

import {
  FaFutbol,
  FaChartLine,
  FaCrown,
  FaGift,
} from "react-icons/fa";

function StatsGrid() {
  const { stats } = useDashboard();

  const statItems = [
    {
      title: "Total Predictions",
      value: stats?.totalPredictions ?? 0,
      icon: FaFutbol,
      color: "blue",
    },
    {
      title: "Average Confidence",
      value: `${stats?.averageConfidence ?? 0}%`,
      icon: FaChartLine,
      color: "green",
    },
    {
      title: "Premium Tips",
      value: stats?.premiumPredictions ?? 0,
      icon: FaCrown,
      color: "gold",
    },
    {
      title: "Free Tips",
      value: stats?.freePredictions ?? 0,
      icon: FaGift,
      color: "purple",
    },
  ];

  return (
    <div className="stats-grid">
      {statItems.map((stat) => (
        <StatsCard
          key={stat.title}
          {...stat}
        />
      ))}
    </div>
  );
}

export default StatsGrid;