import { useState } from "react";
import axios from "axios";

function PremiumPage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

    const { data } = await axios.post(
  "http://localhost:5000/api/payment/initialize",
  {
    plan: "monthly",
  },
  {headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    console.log("Paystack Response:", data);

if (data.data?.authorization_url) {
  window.location.href = data.data.authorization_url;
} else {
  alert("Unable to initialize payment.");
}
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Payment initialization failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">Premium</div>

        <h1>Unlock Premium Predictions</h1>

        <p className="auth-subtitle">
          Premium members get deeper analysis,
          higher confidence predictions,
          priority updates,
          and exclusive premium tips.
        </p>

        <button
          className="btn btn-primary"
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? "Redirecting..." : "Upgrade to Premium"}
        </button>
      </div>
    </section>
  );
}

export default PremiumPage;