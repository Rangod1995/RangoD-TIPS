import "./Dashboard.css";
import { useDashboard } from "../../context/DashboardContext";

function AccountCard() {
  const { profile } = useDashboard();

  if (!profile) {
    return (
      <div className="dashboard-section">
        <h2>My Account</h2>
        <p>Loading profile...</p>
      </div>
    );
  }


  const subscription =
    profile.subscription || "Free";


  const isPremium =
    subscription.toLowerCase() === "premium";


  return (
    <div className="dashboard-section">

      <h2>
        My Account
      </h2>


      <div className="account-card-content">


        <div className="account-avatar">

          {profile.avatar ? (

            <img
              src={profile.avatar}
              alt={profile.name || "User"}
            />

          ) : (

            <div className="avatar-placeholder">

              {profile.name
                ? profile.name
                    .charAt(0)
                    .toUpperCase()
                : "U"}

            </div>

          )}

        </div>




        <div className="account-details">


          <h3>
            {profile.name || "User"}
          </h3>


          <p>
            {profile.email}
          </p>



          <span
            className={
              isPremium
                ? "subscription-badge premium"
                : "subscription-badge free"
            }
          >

            {isPremium
              ? "⭐ Premium"
              : "🆓 Free"}

          </span>




          <small>

            Member since{" "}

            {profile.createdAt
              ? new Date(
                  profile.createdAt
                ).toLocaleDateString()
              : "Recently"}

          </small>



        </div>


      </div>


    </div>
  );
}

export default AccountCard;