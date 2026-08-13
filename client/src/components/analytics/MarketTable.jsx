import "./MarketTable.css";
import { motion } from "framer-motion";

export default function MarketTable({
  markets = [],
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
        <h2>Market Performance</h2>

        <p>
          Prediction accuracy by betting market
        </p>
      </div>

      <div className="analytics-table-wrapper">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Market</th>
              <th>Total</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Accuracy</th>
            </tr>
          </thead>

          <tbody>
            {markets.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="empty-cell"
                >
                  No market analytics available.
                </td>
              </tr>
            ) : (
              markets.map((market) => (
                <tr key={market.market}>
                  <td>{market.market}</td>

                  <td>{market.total}</td>

                  <td>{market.wins}</td>

                  <td>{market.losses}</td>

                  <td>
                    <span
                      className={
                        market.accuracy >= 70
                          ? "badge success"
                          : market.accuracy >= 50
                          ? "badge warning"
                          : "badge danger"
                      }
                    >
                      {market.accuracy}%
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