import "./AccuracyChart.css";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function AccuracyChart({
  data = [],
}) {
  return (
    <motion.div
      className="chart-card"
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
      <div className="chart-header">
        <h2>Accuracy Trend</h2>

        <p>
          Monthly prediction
          performance
        </p>
      </div>

      <ResponsiveContainer
        width="100%"
        height={350}
      >
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="period" />

          <YAxis />

          <Tooltip />

          <Legend />

          <Line
            type="monotone"
            dataKey="accuracy"
            name="Accuracy %"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{
              r: 4,
            }}
          />

          <Line
            type="monotone"
            dataKey="wins"
            name="Wins"
            stroke="#16a34a"
            strokeWidth={2}
          />

          <Line
            type="monotone"
            dataKey="losses"
            name="Losses"
            stroke="#dc2626"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}