import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./AccountPage.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
   loadSubscription();
loadPaymentHistory();
  }, []);

  async function loadSubscription() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/payment/subscription`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      async function loadPaymentHistory() {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/payment/history`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    setPayments(data.payments || []);
  } catch (error) {
    console.error(error);
  }
}

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setSubscription(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="account-page">

      <div className="account-card">

        <h1>My Account</h1>

        <div className="account-section">

          <h2>Profile</h2>

          <div className="info-row">
            <span>Name</span>
            <strong>{user?.name}</strong>
          </div>

          <div className="info-row">
            <span>Email</span>
            <strong>{user?.email}</strong>
          </div>

          <div className="info-row">
            <span>Role</span>
            <strong>{user?.role}</strong>
          </div>

        </div>

        <div className="account-section">

          <h2>Subscription</h2>

          {loading ? (
            <p>Loading subscription...</p>
          ) : (
            <>
              <div className="info-row">
                <span>Plan</span>
                <strong>{subscription?.plan}</strong>
              </div>

              <div className="info-row">
                <span>Status</span>

                <span
                  className={
                    subscription?.status === "Active"
                      ? "status active"
                      : "status expired"
                  }
                >
                  {subscription?.status}
                </span>
              </div>

              <div className="info-row">
                <span>Amount Paid</span>
                <strong>
                  ₦{subscription?.amount?.toLocaleString()}
                </strong>
              </div>

              <div className="info-row">
                <span>Expires</span>
                <strong>
                  {subscription?.expiresAt
                    ? new Date(
                        subscription.expiresAt
                      ).toLocaleDateString()
                    : "-"}
                </strong>
              </div>

              <div className="info-row">
                <span>Days Remaining</span>
                <strong>
                  {subscription?.daysRemaining ?? 0}
                </strong>
              </div>

              <div className="info-row">
                <span>Reference</span>
                <strong>
                  {subscription?.paymentReference || "-"}
                </strong>
              </div>
            </>
          )}

          <button
            className="renew-btn"
            onClick={() => navigate("/pricing")}
          >
            Renew Subscription
          </button>

        </div>

        <div className="account-section">

  <h2>Payment History</h2>

  {payments.length === 0 ? (

    <p>No payments found.</p>

  ) : (

    <table className="payment-table">

      <thead>
        <tr>
          <th>Date</th>
          <th>Plan</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Reference</th>
        </tr>
      </thead>

      <tbody>

        {payments.map((payment) => (

          <tr key={payment._id}>

            <td>
              {new Date(payment.paidAt).toLocaleDateString()}
            </td>

            <td>
              {payment.plan === "monthly"
                ? "Premium Monthly"
                : "Premium Yearly"}
            </td>

            <td>
              ₦{payment.amount.toLocaleString()}
            </td>

            <td>
              {payment.status}
            </td>

            <td>
              {payment.paymentReference}
            </td>

          </tr>

        ))}

      </tbody>

    </table>

  )}

</div>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </div>
  );
}

export default AccountPage;