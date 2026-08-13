import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import { getLiveMatches } from "../../api/dashboardApi";

function LiveMatchesWidget() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);


  async function loadMatches() {
    try {
      setLoading(true);

      const data = await getLiveMatches();

      setMatches(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {
      console.error(
        "Failed to load live matches:",
        error
      );

      setMatches([]);

    } finally {
      setLoading(false);
    }
  }



  useEffect(() => {
    loadMatches();
  }, []);



  return (
    <div className="dashboard-section">


      <div className="section-header">

        <h2>
          Live Matches
        </h2>


        <span className="prediction-count">
          {matches.length}
        </span>


      </div>




      {loading ? (

        <div className="dashboard-loading">
          Loading live matches...
        </div>


      ) : matches.length === 0 ? (


        <div className="empty-state">

          No live matches right now.

        </div>


      ) : (


        <div className="live-matches-list">


          {matches.slice(0, 5).map(
            (match, index) => {


              const fixtureId =
                match.fixtureId ??
                match.fixture?.id ??
                match.id ??
                index;


              const homeTeam =
                match.homeTeam ??
                match.teams?.home?.name ??
                "Home";


              const awayTeam =
                match.awayTeam ??
                match.teams?.away?.name ??
                "Away";


              const league =
                typeof match.league === "string"
                  ? match.league
                  : match.league?.name ??
                    "Unknown League";


              const elapsed =
                match.elapsed ??
                match.fixture?.status?.elapsed ??
                "";



              return (

                <div
                  key={fixtureId}
                  className="live-match-card"
                >


                  <div className="live-match-teams">

                    <strong>
                      {homeTeam}
                    </strong>


                    <span>
                      vs
                    </span>


                    <strong>
                      {awayTeam}
                    </strong>


                  </div>



                  <p>
                    {league}
                  </p>



                  <div className="live-match-footer">


                    <span className="live-badge">
                      🔴 LIVE
                    </span>


                    <span>
                      {elapsed
                        ? `${elapsed}'`
                        : ""}
                    </span>


                  </div>


                </div>

              );

            }

          )}


        </div>


      )}



      <Link
        to="/live-matches"
        className="dashboard-link"
      >
        View all live matches →
      </Link>



    </div>
  );
}

export default LiveMatchesWidget;