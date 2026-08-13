import { Link } from "react-router-dom";
import { useDashboard } from "../../context/DashboardContext.jsx";
import "./dashboard.css";

// ==========================================
// RangoD TIPS V7 Enterprise
// Safe Dashboard Page
// ==========================================

// ==========================================
// SAFE TEXT
// Never allow API objects to reach JSX
// ==========================================

function safeText(value, fallback = "") {
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
    const result = value
      .map((item) => safeText(item, ""))
      .filter(Boolean)
      .join(" • ");

    return result || fallback;
  }

  if (typeof value === "object") {
    return (
      safeText(value.selection, "") ||
      safeText(value.market, "") ||
      safeText(value.pick, "") ||
      safeText(value.tip, "") ||
      safeText(value.recommendation, "") ||
      safeText(value.prediction, "") ||
      safeText(value.value, "") ||
      safeText(value.label, "") ||
      safeText(value.name, "") ||
      safeText(value.text, "") ||
      safeText(value.summary, "") ||
      fallback
    );
  }

  return fallback;
}

// ==========================================
// SAFE NUMBER
// Supports numbers and confidence objects
// ==========================================

function safeNumber(value, fallback = 0) {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const number = Number(
      value.confidence ??
        value.score ??
        value.value ??
        value.amount
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

// ==========================================
// SAFE CONFIDENCE
// ==========================================

function getConfidenceValue(item) {
  const confidence =
    item?.prediction?.confidence ??
    item?.confidence ??
    0;

  return Math.max(
    0,
    Math.min(
      100,
      safeNumber(confidence, 0)
    )
  );
}

// ==========================================
// SAFE PREDICTION TEXT
// ==========================================

function getPredictionText(prediction) {
  if (!prediction) {
    return "—";
  }

  if (typeof prediction === "string") {
    return prediction;
  }

  if (typeof prediction === "object") {
    return (
      safeText(prediction.selection, "") ||
      safeText(prediction.recommendedMarket, "") ||
      safeText(prediction.market, "") ||
      safeText(prediction.pick, "") ||
      safeText(prediction.tip, "") ||
      safeText(prediction.recommendation, "") ||
      safeText(prediction.prediction, "") ||
      "Prediction"
    );
  }

  return safeText(
    prediction,
    "Prediction"
  );
}

// ==========================================
// SAFE RESULT
// ==========================================

function getResultText(result) {
  if (!result) {
    return "PENDING";
  }

  return safeText(
    result,
    "PENDING"
  ).toUpperCase();
}

// ==========================================
// RESULT CLASS
// ==========================================

function getResultClass(result) {
  const normalized =
    getResultText(result);

  if (normalized === "WIN") {
    return "win";
  }

  if (normalized === "LOSS") {
    return "loss";
  }

  return "pending";
}

// ==========================================
// SAFE TEAM NAME
// ==========================================

function getTeamName(team, fallback) {
  if (!team) {
    return fallback;
  }

  if (typeof team === "string") {
    return team;
  }

  if (typeof team === "object") {
    return (
      safeText(team.name, "") ||
      safeText(team.shortName, "") ||
      safeText(team.teamName, "") ||
      fallback
    );
  }

  return safeText(
    team,
    fallback
  );
}

// ==========================================
// COMPONENT
// ==========================================

function DashboardPage() {
  const {
    loading,
    error,
    profile,
    stats,
    recentPredictions,
    favorites,
    refreshDashboard,
  } = useDashboard();

  const safeStats = stats || {};

  const safeRecentPredictions =
    Array.isArray(recentPredictions)
      ? recentPredictions
      : [];

  const safeFavorites =
    Array.isArray(favorites)
      ? favorites
      : [];

  // ========================================
  // PROFILE
  // ========================================

  const displayName =
    safeText(profile?.name, "") ||
    safeText(
      profile?.email?.split("@")[0],
      ""
    ) ||
    "User";

  const email =
    safeText(
      profile?.email,
      "No email available"
    );

  const isPremium =
    profile?.subscription === "premium" ||
    profile?.isPremium === true;

  // ========================================
  // STATS
  // ========================================

  const totalPredictions = safeNumber(
    safeStats.totalPredictions,
    0
  );

  const todayPredictions = safeNumber(
    safeStats.todayPredictions,
    0
  );

  const averageConfidence = Math.max(
    0,
    Math.min(
      100,
      safeNumber(
        safeStats.averageConfidence,
        0
      )
    )
  );

  const accuracy = Math.max(
    0,
    Math.min(
      100,
      safeNumber(
        safeStats.accuracy,
        0
      )
    )
  );

  const freePredictions = safeNumber(
    safeStats.freePredictions,
    0
  );

  const premiumPredictions =
    safeNumber(
      safeStats.premiumPredictions,
      0
    );

  const completedPredictions =
    safeNumber(
      safeStats.completedPredictions,
      0
    );

  const pendingPredictions =
    safeNumber(
      safeStats.pendingPredictions,
      0
    );

  // ========================================
  // DATE
  // ========================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />

          <h2>
            Loading Dashboard
          </h2>

          <p>
            Fetching your RangoD TIPS data...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // DASHBOARD
  // ========================================

  return (
    <div className="dashboard-page">

      {/* ======================================
          HEADER
      ======================================= */}

      <section className="dashboard-welcome">
        <div>

          <span className="dashboard-eyebrow">
            RangoD TIPS
          </span>

          <h1>
            Welcome back, {displayName}
          </h1>

          <p>
            Your football prediction dashboard
            and latest RangoD TIPS insights.
          </p>

        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={refreshDashboard}
        >
          ↻ Refresh
        </button>
      </section>


      {/* ======================================
          ERROR
      ======================================= */}

      {error && (
        <div className="dashboard-error">

          <div>

            <strong>
              Some dashboard data could not
              be loaded.
            </strong>

            <span>
              {safeText(
                error,
                "Unable to load dashboard data."
              )}
            </span>

          </div>

          <button
            type="button"
            onClick={refreshDashboard}
          >
            Try Again
          </button>

        </div>
      )}


      {/* ======================================
          STATISTICS
      ======================================= */}

      <section className="dashboard-stats">

        <div className="stat-card">

          <div className="stat-icon">
            ⚽
          </div>

          <div>

            <span>
              Total Predictions
            </span>

            <strong>
              {totalPredictions}
            </strong>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            📅
          </div>

          <div>

            <span>
              Today's Predictions
            </span>

            <strong>
              {todayPredictions}
            </strong>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            🎯
          </div>

          <div>

            <span>
              Average Confidence
            </span>

            <strong>
              {Math.round(
                averageConfidence
              )}
              %
            </strong>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            📈
          </div>

          <div>

            <span>
              Prediction Accuracy
            </span>

            <strong>
              {Math.round(
                accuracy
              )}
              %
            </strong>

          </div>

        </div>

      </section>


      {/* ======================================
          SECONDARY STATISTICS
      ======================================= */}

      <section className="secondary-stats">

        <div className="secondary-stat">

          <span>
            Free Predictions
          </span>

          <strong>
            {freePredictions}
          </strong>

        </div>


        <div className="secondary-stat">

          <span>
            Premium Predictions
          </span>

          <strong>
            {premiumPredictions}
          </strong>

        </div>


        <div className="secondary-stat">

          <span>
            Completed
          </span>

          <strong>
            {completedPredictions}
          </strong>

        </div>


        <div className="secondary-stat">

          <span>
            Pending
          </span>

          <strong>
            {pendingPredictions}
          </strong>

        </div>

      </section>


      {/* ======================================
          MAIN DASHBOARD GRID
      ======================================= */}

      <div className="dashboard-grid">

        {/* ====================================
            RECENT PREDICTIONS
        ===================================== */}

        <section className="dashboard-panel predictions-panel">

          <div className="panel-header">

            <div>

              <span className="panel-label">
                AI PREDICTIONS
              </span>

              <h2>
                Recent Predictions
              </h2>

            </div>

            <Link to="/predictions">
              View All →
            </Link>

          </div>


          {safeRecentPredictions.length === 0 ? (

            <div className="dashboard-empty">

              <div className="empty-icon">
                ⚽
              </div>

              <h3>
                No predictions available
              </h3>

              <p>
                Your latest RangoD TIPS
                predictions will appear here.
              </p>

              <Link
                to="/predictions"
                className="dashboard-action"
              >
                View Predictions
              </Link>

            </div>

          ) : (

            <div className="prediction-list">

              {safeRecentPredictions.map(
                (item, index) => {

                  const confidence =
                    getConfidenceValue(item);

                  const predictionText =
                    getPredictionText(
                      item?.prediction
                    );

                  const result =
                    getResultText(
                      item?.result ||
                        item?.status
                    );

                  const homeName =
                    getTeamName(
                      item?.homeTeam ||
                        item?.teams?.home,
                      "Home Team"
                    );

                  const awayName =
                    getTeamName(
                      item?.awayTeam ||
                        item?.teams?.away,
                      "Away Team"
                    );

                  const leagueName =
                    safeText(
                      item?.league ||
                        item?.competition,
                      "Football"
                    );

                  return (
                    <div
                      className="prediction-row"
                      key={
                        item?._id ||
                        item?.fixtureId ||
                        index
                      }
                    >

                      {/* TEAMS */}

                      <div className="teams">

                        <strong>
                          {homeName}
                        </strong>

                        <span>
                          vs
                        </span>

                        <strong>
                          {awayName}
                        </strong>

                        <small>
                          {leagueName}
                        </small>

                      </div>


                      {/* PREDICTION */}

                      <div className="prediction-value">

                        <span>
                          Prediction
                        </span>

                        <strong>
                          {predictionText}
                        </strong>

                      </div>


                      {/* CONFIDENCE */}

                      <div className="confidence">

                        <span>
                          Confidence
                        </span>

                        <strong>
                          {Math.round(
                            confidence
                          )}
                          %
                        </strong>

                      </div>


                      {/* RESULT */}

                      <div
                        className={`prediction-result ${getResultClass(
                          item?.result ||
                            item?.status
                        )}`}
                      >
                        {result}
                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>


        {/* ====================================
            ACCOUNT
        ===================================== */}

        <section className="dashboard-panel account-panel">

          <div className="panel-header">

            <div>

              <span className="panel-label">
                ACCOUNT
              </span>

              <h2>
                Your Profile
              </h2>

            </div>

          </div>


          <div className="profile-box">

            <div className="profile-avatar">
              {displayName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="profile-info">

              <h3>
                {displayName}
              </h3>

              <p>
                {email}
              </p>

              <span className="subscription-badge">
                {isPremium
                  ? "Premium"
                  : "Free Account"}
              </span>

            </div>

          </div>


          <div className="account-details">

            <div>

              <span>
                Member Since
              </span>

              <strong>
                {formatDate(
                  profile?.createdAt
                )}
              </strong>

            </div>


            <div>

              <span>
                Favorites
              </span>

              <strong>
                {safeFavorites.length}
              </strong>

            </div>

          </div>


          <Link
            to="/pricing"
            className="premium-link"
          >
            {isPremium
              ? "Manage Premium"
              : "Upgrade to Premium"}
          </Link>

        </section>

      </div>


      {/* ======================================
          QUICK ACTIONS
      ======================================= */}

      <section className="quick-section">

        <div className="section-title">

          <span className="panel-label">
            QUICK ACCESS
          </span>

          <h2>
            Explore RangoD TIPS
          </h2>

        </div>


        <div className="quick-actions">

          <Link
            to="/predictions"
            className="quick-card"
          >

            <span>
              ⚽
            </span>

            <div>

              <h3>
                Predictions
              </h3>

              <p>
                Explore today's AI
                predictions.
              </p>

            </div>

            <b>
              →
            </b>

          </Link>


          <Link
            to="/live-matches"
            className="quick-card"
          >

            <span>
              🔴
            </span>

            <div>

              <h3>
                Live Matches
              </h3>

              <p>
                Follow matches happening
                now.
              </p>

            </div>

            <b>
              →
            </b>

          </Link>


          <Link
            to="/competitions"
            className="quick-card"
          >

            <span>
              🏆
            </span>

            <div>

              <h3>
                Competitions
              </h3>

              <p>
                Explore football leagues.
              </p>

            </div>

            <b>
              →
            </b>

          </Link>


          <Link
            to="/pricing"
            className="quick-card"
          >

            <span>
              👑
            </span>

            <div>

              <h3>
                Premium
              </h3>

              <p>
                Unlock deeper analysis.
              </p>

            </div>

            <b>
              →
            </b>

          </Link>

        </div>

      </section>


      {/* ======================================
          PREMIUM BANNER
      ======================================= */}

      <section className="premium-banner">

        <div>

          <span>
            RangoD TIPS PREMIUM
          </span>

          <h2>
            Take your football analysis
            further.
          </h2>

          <p>
            Get deeper AI analysis,
            confidence breakdowns,
            premium predictions and
            advanced football insights.
          </p>

        </div>

        <Link
          to="/pricing"
          className="premium-button"
        >
          {isPremium
            ? "View Plan"
            : "Upgrade Now"}
        </Link>

      </section>

    </div>
  );
}

export default DashboardPage;