// client/src/pages/Admin/AdminDashboard.jsx

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

// ==========================================
// SAFE HELPERS
// ==========================================

function safeText(value, fallback = "—") {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    const text = value
      .map((item) => safeText(item, ""))
      .filter(Boolean)
      .join(" • ");

    return text || fallback;
  }

  if (typeof value === "object") {
    return (
      safeText(value.selection, "") ||
      safeText(value.market, "") ||
      safeText(value.pick, "") ||
      safeText(value.tip, "") ||
      safeText(value.recommendation, "") ||
      safeText(value.prediction, "") ||
      safeText(value.label, "") ||
      safeText(value.value, "") ||
      safeText(value.name, "") ||
      safeText(value.text, "") ||
      fallback
    );
  }

  return fallback;
}

function safeNumber(value, fallback = 0) {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const number = Number(
      value.confidence ??
        value.score ??
        value.value
    );

    return Number.isFinite(number)
      ? number
      : fallback;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function getConfidence(prediction) {
  const value =
    prediction?.prediction?.confidence ??
    prediction?.confidence ??
    0;

  return Math.max(
    0,
    Math.min(
      100,
      safeNumber(value, 0)
    )
  );
}

function getPredictionText(prediction) {
  return (
    safeText(
      prediction?.prediction,
      ""
    ) ||
    safeText(
      prediction?.market,
      ""
    ) ||
    safeText(
      prediction?.selection,
      ""
    ) ||
    "Prediction"
  );
}

// ==========================================
// STAT CARD
// ==========================================

function StatCard({
  title,
  value,
  color,
}) {
  return (
    <div className={`stat-card ${color}`}>
      <h3>{title}</h3>

      <h2>
        {safeNumber(value, 0)}
      </h2>
    </div>
  );
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalPredictions: 0,
    todayPredictions: 0,
    premiumPredictions: 0,
    totalUsers: 0,
  });

  const [recentPredictions, setRecentPredictions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ========================================
  // LOAD DASHBOARD
  // ========================================

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/admin/dashboard`,
        {
          method: "GET",
          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      let data = {};

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        const text =
          await response.text();

        throw new Error(
          text ||
            `Admin API returned ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Admin API error: ${response.status}`
        );
      }

      setStats({
        totalPredictions:
          safeNumber(
            data?.stats
              ?.totalPredictions ??
              data?.totalPredictions,
            0
          ),

        todayPredictions:
          safeNumber(
            data?.stats
              ?.todayPredictions ??
              data?.todayPredictions,
            0
          ),

        premiumPredictions:
          safeNumber(
            data?.stats
              ?.premiumPredictions ??
              data?.premiumPredictions,
            0
          ),

        totalUsers:
          safeNumber(
            data?.stats
              ?.totalUsers ??
              data?.totalUsers ??
              data?.stats?.users,
            0
          ),
      });

      setRecentPredictions(
        Array.isArray(
          data?.recentPredictions
        )
          ? data.recentPredictions
          : Array.isArray(data?.predictions)
          ? data.predictions
          : []
      );
    } catch (err) {
      console.error(
        "Admin dashboard error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load admin dashboard."
      );

      setStats({
        totalPredictions: 0,
        todayPredictions: 0,
        premiumPredictions: 0,
        totalUsers: 0,
      });

      setRecentPredictions([]);
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // DELETE PREDICTION
  // ========================================

  async function deletePrediction(id) {
    if (!id) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this prediction?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/predictions/${id}`,
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      if (!response.ok) {
        let message =
          "Failed to delete prediction.";

        try {
          const data =
            await response.json();

          message =
            data?.message ||
            data?.error ||
            message;
        } catch {
          // Ignore JSON parsing failure.
        }

        throw new Error(message);
      }

      await loadDashboard();
    } catch (err) {
      console.error(
        "Delete prediction error:",
        err
      );

      alert(
        err?.message ||
          "Failed to delete prediction."
      );
    }
  }

  // ========================================
  // EDIT
  // ========================================

  function editPrediction(prediction) {
    const home =
      safeText(
        prediction?.homeTeam,
        "Home Team"
      );

    const away =
      safeText(
        prediction?.awayTeam,
        "Away Team"
      );

    alert(
      `Edit feature coming soon.\n\n${home} vs ${away}`
    );
  }

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1>
            Loading Admin Dashboard...
          </h1>

          <p>
            Fetching RangoD TIPS platform
            data.
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="admin-dashboard">

      {/* ====================================
          HEADER
      ===================================== */}

      <div className="admin-header">

        <div>
          <h1>
            Admin Dashboard
          </h1>

          <p>
            Welcome back. Manage the
            RangoD TIPS platform.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          className="refresh-button"
        >
          ↻ Refresh
        </button>

      </div>


      {/* ====================================
          API ERROR
      ===================================== */}

      {error && (
        <div className="admin-error">

          <strong>
            Admin data could not be loaded.
          </strong>

          <span>
            {safeText(
              error,
              "API endpoint unavailable."
            )}
          </span>

          <button
            type="button"
            onClick={loadDashboard}
          >
            Try Again
          </button>

        </div>
      )}


      {/* ====================================
          QUICK ACTIONS
      ===================================== */}

      <div className="quick-actions">

        <div
          className="action-card"
          onClick={() =>
            navigate(
              "/admin/predictions"
            )
          }
        >
          <h2>⚽</h2>

          <h3>
            Predictions
          </h3>

          <p>
            Create and manage
            predictions.
          </p>
        </div>


        <div
          className="action-card"
          onClick={() =>
            navigate(
              "/admin/users"
            )
          }
        >
          <h2>👥</h2>

          <h3>
            Users
          </h3>

          <p>
            Manage registered
            users.
          </p>
        </div>


        <div
          className="action-card"
          onClick={() =>
            navigate(
              "/admin/analytics"
            )
          }
        >
          <h2>📈</h2>

          <h3>
            Analytics
          </h3>

          <p>
            View system reports.
          </p>
        </div>

      </div>


      {/* ====================================
          STATISTICS
      ===================================== */}

      <div className="stats-grid">

        <StatCard
          title="Total Predictions"
          value={
            stats.totalPredictions
          }
          color="blue"
        />

        <StatCard
          title="Today's Predictions"
          value={
            stats.todayPredictions
          }
          color="green"
        />

        <StatCard
          title="Premium Predictions"
          value={
            stats.premiumPredictions
          }
          color="purple"
        />

        <StatCard
          title="Users"
          value={
            stats.totalUsers
          }
          color="orange"
        />

      </div>


      {/* ====================================
          RECENT PREDICTIONS
      ===================================== */}

      <div className="recent-section">

        <div className="section-title">

          <h2>
            Recent Predictions
          </h2>

          <Link to="/predictions">
            View All
          </Link>

        </div>


        {recentPredictions.length ===
        0 ? (

          <div className="empty-state">

            <h3>
              No recent predictions
            </h3>

            <p>
              Predictions will appear
              here when available.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    Match
                  </th>

                  <th>
                    League
                  </th>

                  <th>
                    Prediction
                  </th>

                  <th>
                    Confidence
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {recentPredictions.map(
                  (
                    prediction,
                    index
                  ) => {

                    const id =
                      prediction?._id ||
                      prediction?.fixtureId ||
                      index;

                    const homeTeam =
                      safeText(
                        prediction?.homeTeam ||
                          prediction?.teams
                            ?.home
                            ?.name,
                        "Home Team"
                      );

                    const awayTeam =
                      safeText(
                        prediction?.awayTeam ||
                          prediction?.teams
                            ?.away
                            ?.name,
                        "Away Team"
                      );

                    const league =
                      safeText(
                        prediction?.league ||
                          prediction?.competition,
                        "Football"
                      );

                    const predictionText =
                      getPredictionText(
                        prediction
                      );

                    const confidence =
                      getConfidence(
                        prediction
                      );

                    return (
                      <tr
                        key={id}
                      >

                        <td>
                          {homeTeam}
                          {" vs "}
                          {awayTeam}
                        </td>

                        <td>
                          {league}
                        </td>

                        <td>
                          {predictionText}
                        </td>

                        <td>
                          {Math.round(
                            confidence
                          )}
                          %
                        </td>

                        <td>

                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() =>
                              editPrediction(
                                prediction
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() =>
                              deletePrediction(
                                prediction?._id ||
                                  prediction?.fixtureId
                              )
                            }
                          >
                            Delete
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default AdminDashboard;