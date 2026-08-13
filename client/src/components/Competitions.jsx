import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { getCompetitions } from "../api/footballApi";
import "./Competitions.css";

function Competitions() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCompetitions() {
      setLoading(true);
      setError(null);

      try {
        const data = await getCompetitions();
        setCompetitions(data);
      } catch (err) {
        setError(err.message || "Failed to load competitions.");
      } finally {
        setLoading(false);
      }
    }

    loadCompetitions();
  }, []);

  if (loading) {
    return (
      <section className="competitions">
        <div className="container">
          <div className="section-header">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-4 animate-pulse"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto animate-pulse"></div>
          </div>

          <div className="competition-grid">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 animate-pulse"
              >
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-full w-12 mx-auto mb-4"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto mb-4"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="competitions">
        <div className="container">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

 const merged = competitions;

  return (
    <section className="competitions">
      <div className="container">

        <div className="section-header">
          <span className="section-badge">TOP LEAGUES</span>

          <h2>Competitions We Cover</h2>

          <p>
            Our AI analyzes matches from the world's biggest football
            competitions every day to deliver high-quality predictions.
          </p>
        </div>

        <div className="competition-grid">
          {merged.map((league) => (
            <div className="competition-card" key={league.name}>

              <div className="league-logo">
                {league.logo}
              </div>

              <h3>{league.name}</h3>

              <p>{league.country}</p>

              <div className="league-stats">
    <div>
      <strong>{league.matchesToday}</strong>
      <small>Today's Matches</small>
    </div>

    <div>
      <strong>{league.predictions}</strong>
      <small>AI Predictions</small>
    </div>
</div>

{league.predictions > 0 ? (
  <NavLink
    to={`/predictions?league=${encodeURIComponent(league.name)}`}
    className="league-btn"
  >
    View Analysis →
  </NavLink>
) : (
  <button
    className="league-btn"
    disabled
  >
    No Predictions Today
  </button>
)}

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default Competitions;