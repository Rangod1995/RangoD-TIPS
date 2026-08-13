import "./ConfidenceTable.css";
import { motion } from "framer-motion";

export default function ConfidenceTable({
  confidenceBands = [],
}) {
  return (
    <motion.div
      className="analytics-table-card"
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
      <div className="analytics-table-header">
        <h2>Confidence Band Performance</h2>

        <p>
          Prediction accuracy grouped by AI confidence.
        </p>
      </div>

      <div className="analytics-table-wrapper">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Confidence</th>
              <th>Total</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Accuracy</th>
            </tr>
          </thead>

          <tbody>
            {confidenceBands.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="empty-cell"
                >
                  No confidence analytics available.
                </td>
              </tr>
            ) : (
              confidenceBands.map((band) => (
                <tr key={band.band}>
                  <td>{band.band}%</td>

                  <td>{band.total}</td>

                  <td>{band.wins}</td>

                  <td>{band.losses}</td>

                  <td>
                    <span
                      className={
                        band.accuracy >= 70
                          ? "badge success"
                          : band.accuracy >= 50
                          ? "badge warning"
                          : "badge danger"
                      }
                    >
                      {band.accuracy}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}