import "./Dashboard.css";
import { useDashboard } from "../../context/DashboardContext";

function RecentPredictions() {
  const { recentPredictions } = useDashboard();

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Recent Predictions</h2>

        <span className="prediction-count">
          {recentPredictions.length} Predictions
        </span>
      </div>

      {recentPredictions.length === 0 ? (
        <div className="empty-state">
          No predictions available.
        </div>
      ) : (
        <div className="prediction-list">
          {recentPredictions.map((prediction) => (
            <div
             key={prediction._id}
              className="prediction-card"
            >
              <div className="prediction-details">
                <h3>
                  {prediction.homeTeam} vs {prediction.awayTeam}
                </h3>

                <p>{prediction.league}</p>

                <small>
                  {prediction.status || "Upcoming"}
                </small>
              </div>

              <div className="prediction-info">
                <span className="prediction-market">
                  {prediction.prediction}
                </span>

                <strong className="prediction-confidence">
                  {prediction.confidence}%
                </strong>

                {prediction.isPremium ? (
                  <span className="premium-badge">
                    Premium
                  </span>
                ) : (
                  <span className="free-badge">
                    Free
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentPredictions;