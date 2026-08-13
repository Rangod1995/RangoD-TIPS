import "./Dashboard.css";
import { useDashboard } from "../../context/DashboardContext";

function TopLeagues() {
  const { recentPredictions } = useDashboard();

  const leagueMap = {};


  recentPredictions.forEach((prediction) => {

    const league =
      prediction.league?.trim() ||
      "Unknown League";


    leagueMap[league] =
      (leagueMap[league] || 0) + 1;

  });



  const topLeagues =
    Object.entries(leagueMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);



  const total =
    recentPredictions.length || 1;



  return (
    <div className="dashboard-section">


      <div className="section-header">

        <h2>
          Top Leagues
        </h2>


        <span className="prediction-count">
          {topLeagues.length}
        </span>


      </div>



      {topLeagues.length === 0 ? (


        <div className="empty-state">

          No league data available.

        </div>


      ) : (


        <div className="top-leagues-list">


          {topLeagues.map(
            ([league, count], index) => (

              <div
                key={league}
                className="league-card"
              >


                <div className="league-rank">

                  #{index + 1}

                </div>



                <div className="league-info">


                  <h3>
                    {league}
                  </h3>


                  <p>

                    {count} Prediction
                    {count !== 1 ? "s" : ""}

                    {" • "}

                    {Math.round(
                      (count / total) * 100
                    )}%

                  </p>



                </div>



              </div>

            )

          )}


        </div>


      )}



    </div>
  );
}

export default TopLeagues;