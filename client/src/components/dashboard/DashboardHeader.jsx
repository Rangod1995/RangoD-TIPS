import "./Dashboard.css";
import { Link } from "react-router-dom";

function DashboardHeader({ user }) {
  const isPremium =
    user?.subscription === "premium" ||
    user?.isPremium;

  return (
    <div className="dashboard-header">

      <div className="dashboard-header-text">

        <h1>
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h1>

        <p>
          Here's an overview of today's AI-powered football predictions.
        </p>

      </div>


      <div className="dashboard-header-action">

        {isPremium ? (

          <div className="premium-status">
            ⭐ Premium Member
          </div>

        ) : (

          <Link
            to="/pricing"
            className="premium-btn"
          >
            Upgrade to Premium
          </Link>

        )}

      </div>


    </div>
  );
}

export default DashboardHeader;