import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Pricing.css";

const pricing = {
  NGN: {
    symbol: "₦",
    premium: "15,000",
  },
  USD: {
    symbol: "$",
    premium: "9.99",
  },
  GBP: {
    symbol: "£",
    premium: "7.99",
  },
  EUR: {
    symbol: "€",
    premium: "8.99",
  },
};

const plans = [
  {
    id: 1,
    name: "Free",
    featured: false,
    features: [
      "Daily Predictions",
      "Basic AI Analysis",
      "Live Match Updates",
      "Limited Statistics",
    ],
    button: "Get Started",
  },
  {
    id: 2,
    name: "Premium",
    featured: true,
    features: [
      "Everything in Free",
      "Full AI Analysis",
      "High-Confidence Predictions",
      "Premium Competitions",
      "Priority Updates",
      "Future Premium Tools",
    ],
    button: "Upgrade Now",
  },
];

function Pricing() {
  const [currency, setCurrency] = useState("NGN");
  const navigate = useNavigate();

  return (
    <section className="pricing">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">PRICING</span>

          <h2>Choose Your Plan</h2>

          <p>
            Start for free and upgrade whenever you're ready to unlock the
            full RangoD TIPS experience.
          </p>
        </div>

        <div className="currency-selector">
          <label htmlFor="currency">Choose Currency</label>

          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="NGN">🇳🇬 Nigerian Naira (₦)</option>
            <option value="USD">🇺🇸 US Dollar ($)</option>
            <option value="GBP">🇬🇧 British Pound (£)</option>
            <option value="EUR">🇪🇺 Euro (€)</option>
          </select>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card ${
                plan.featured ? "featured" : ""
              }`}
            >
              {plan.featured && (
                <div className="popular-badge">
                  Most Popular
                </div>
              )}

              <h3>{plan.name}</h3>

              <div className="price">
                {plan.name === "Free"
                  ? `${pricing[currency].symbol}0`
                  : `${pricing[currency].symbol}${pricing[currency].premium}`}

                <span>/month</span>
              </div>

              <ul>
                {plan.features.map((feature, index) => (
                  <li key={index}>✔ {feature}</li>
                ))}
              </ul>

           <button
  className="plan-btn"
  onClick={() => {
    if (plan.name === "Free") {
      navigate("/register");
    } else {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
      } else {
        navigate("/premium");
      }
    }
  }}
>
  {plan.button}
</button>         </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing;