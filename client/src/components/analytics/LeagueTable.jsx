import "./LeagueTable.css";
import { motion } from "framer-motion";

export default function LeagueTable({
  leagues = [],
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
        <h2>League Performance</h2>

        <p>
          Prediction accuracy by league
        </p>
      </div>

      <div className="analytics-table-wrapper">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>League</th>
              <th>Total</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Accuracy</th>
            </tr>
          </thead>

          <tbody>
            {leagues.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="empty-cell"
                >
                  No league analytics available.
                </td>
              </tr>
            ) : (
              leagues.map((league) => (
                <tr key={league.league}>
                  <td>{league.league}</td>

                  <td>{league.total}</td>

                  <td>{league.wins}</td>

                  <td>{league.losses}</td>

                  <td>
                    <span
                      className={
                        league.accuracy >= 70
                          ? "badge success"
                          : league.accuracy >= 50
                          ? "badge warning"
                          : "badge danger"
                      }
                    >
                      {league.accuracy}%
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