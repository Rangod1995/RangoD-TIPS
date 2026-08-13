import "./AIInsights.css";
import { motion } from "framer-motion";
import {
  Brain,
  Trophy,
  Target,
} from "lucide-react";

function InsightCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <motion.div
      className="insight-card"
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
      <div className="insight-icon">
        {icon}
      </div>

      <div className="insight-content">
        <h3>{title}</h3>

        <h2>{value}</h2>

        <p>{subtitle}</p>
      </div>
    </motion.div>
  );
}

export default function AIInsights({
  bestLeague,
  bestMarket,
  confidenceBand,
}) {
  return (
    <div className="insights-grid">
      <InsightCard
        icon={<Trophy size={26} />}
        title="Best League"
        value={
          bestLeague?.league ??
          "No Data"
        }
        subtitle={
          bestLeague
            ? `${bestLeague.accuracy}% Accuracy`
            : "No completed predictions"
        }
      />

      <InsightCard
        icon={<Target size={26} />}
        title="Best Market"
        value={
          bestMarket?.market ??
          "No Data"
        }
        subtitle={
          bestMarket
            ? `${bestMarket.accuracy}% Accuracy`
            : "No completed predictions"
        }
      />

      <InsightCard
        icon={<Brain size={26} />}
        title="Best Confidence Band"
        value={
          confidenceBand?.band ??
          "No Data"
        }
        subtitle={
          confidenceBand
            ? `${confidenceBand.accuracy}% Accuracy`
            : "No completed predictions"
        }
      />
    </div>
  );
}