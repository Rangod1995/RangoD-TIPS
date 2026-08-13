import "./PredictionStatusTable.css";
import { motion } from "framer-motion";

function getBadge(status) {
  switch (status?.toLowerCase()) {
    case "won":
      return "badge success";

    case "lost":
      return "badge danger";

    case "pending":
      return "badge warning";

    case "void":
      return "badge secondary";

    default:
      return "badge";
  }
}

export default function PredictionStatusTable({
  statusData = [],
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
        <h2>Prediction Status</h2>

        <p>
          Current prediction outcomes
        </p>
      </div>

      <div className="analytics-table-wrapper">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {statusData.length === 0 ? (
              <tr>
                <td
                  colSpan="2"
                  className="empty-cell"
                >
                  No status data available.
                </td>
              </tr>
            ) : (
              statusData.map((item) => (
                <tr key={item.status}>
                  <td>
                    <span
                      className={getBadge(
                        item.status
                      )}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </td>

                  <td>{item.total}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}