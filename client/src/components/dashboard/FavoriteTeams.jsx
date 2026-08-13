import "./Dashboard.css";
import { useDashboard } from "../../context/DashboardContext";

function FavoriteTeams() {
  const { favorites = [] } = useDashboard();


  return (
    <div className="dashboard-section">


      <div className="section-header">

        <h2>
          Favorite Teams
        </h2>


        <span className="prediction-count">
          {favorites.length}
        </span>


      </div>




      {favorites.length === 0 ? (


        <div className="empty-state">

          <p>
            No favorite teams yet.
          </p>

        </div>


      ) : (


        <div className="favorite-teams-list">


          {favorites.map(
            (team, index) => {


              const teamName =
                team.name ||
                team.teamName ||
                "Unknown Team";


              const country =
                team.country ||
                team.team?.country ||
                "Unknown Country";


              const logo =
                team.logo ||
                team.team?.logo;



              return (

                <div
                  key={
                    team.id ||
                    team._id ||
                    index
                  }
                  className="favorite-team-card"
                >



                  <div className="favorite-team-info">


                    {logo ? (

                      <img
                        src={logo}
                        alt={teamName}
                        className="team-logo"
                      />

                    ) : (

                      <div className="team-logo-placeholder">
                        ⚽
                      </div>

                    )}




                    <div>


                      <h3>
                        {teamName}
                      </h3>


                      <p>
                        {country}
                      </p>


                    </div>



                  </div>



                </div>

              );

            }

          )}


        </div>


      )}


    </div>
  );
}

export default FavoriteTeams;