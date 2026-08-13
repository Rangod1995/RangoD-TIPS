import "./OverviewCards.css";
import {
  Brain,
  Target,
  Trophy,
  Activity,
  Database,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

function Card({
  icon,
  title,
  value,
  color,
}) {
  return (
    <motion.div
      className="overview-card"
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
      }}
    >
      <div
        className="overview-icon"
        style={{
          background: color,
        }}
      >
        {icon}
      </div>

      <div className="overview-content">
        <h4>{title}</h4>

        <h2>{value}</h2>
      </div>
    </motion.div>
  );
}

export default function OverviewCards({
  overview = {},
  performance = {},
}) {
  const cards = [
    {
      title: "Total Predictions",
      value:
        overview.totalPredictions ??
        0,
      color: "#2563eb",
      icon: <Database size={24} />,
    },
    {
      title: "Validated",
      value:
        overview.validatedPredictions ??
        0,
      color: "#16a34a",
      icon: <ShieldCheck size={24} />,
    },
    {
      title: "Accuracy",
      value: `${
        performance.accuracy ??
        0
      }%`,
      color: "#f59e0b",
      icon: <Target size={24} />,
    },
    {
      title: "Average Confidence",
      value: `${
        performance.averageConfidence ??
        0
      }%`,
      color: "#9333ea",
      icon: <Brain size={24} />,
    },
    {
      title: "Engine Version",
      value:
        overview.engineVersion ??
        "v4.0.0",
      color: "#dc2626",
      icon: <Activity size={24} />,
    },
    {
      title: "Best League",
      value:
        performance.bestLeague ??
        "--",
      color: "#0891b2",
      icon: <Trophy size={24} />,
    },
  ];

  return (
    <div className="overview-grid">
      {cards.map((card) => (
        <Card
          key={card.title}
          {...card}
        />
      ))}
    </div>
  );
}