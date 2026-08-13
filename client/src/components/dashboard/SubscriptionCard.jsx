import "./Dashboard.css";
import { useDashboard } from "../../context/DashboardContext";
import { Link } from "react-router-dom";

function SubscriptionCard() {
  const { profile, stats } = useDashboard();

  const isPremium =
    profile?.subscription === "premium" ||
    profile?.isPremium;

  return (
    <div className="dashboard-section">

      <h2>
        Subscription
      </h2>


      <div className="subscription-card-content">


        <div
          className={
            isPremium
              ? "subscription-status premium"
              : "subscription-status free"
          }
        >

          {isPremium
            ? "⭐ Premium Member"
            : "🆓 Free Plan"}

        </div>



        <p>

          {isPremium

            ? "You have access to all premium AI predictions and exclusive insights."

            : "Upgrade to unlock premium predictions, advanced analysis and exclusive tips."}

        </p>




        <div className="subscription-stats">


          <div>
            <strong>
              {stats?.premiumPredictions ?? 0}
            </strong>

            <span>
              Premium Tips
            </span>
          </div>



          <div>
            <strong>
              {stats?.freePredictions ?? 0}
            </strong>

            <span>
              Free Tips
            </span>
          </div>


        </div>




        {!isPremium && (

          <Link
            to="/pricing"
            className="premium-btn"
          >
            Upgrade Now
          </Link>

        )}



      </div>


    </div>
  );
}

export default SubscriptionCard;