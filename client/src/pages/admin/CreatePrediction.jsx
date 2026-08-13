import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function CreatePrediction() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    homeTeam: "",
    awayTeam: "",
    league: "",
    prediction: "",
    market: "",
    confidence: "",
    odds: "",
    analysis: "",
    isPremium: false,
    status: "pending",
  });

  const [loading, setLoading] = useState(false);


  function handleChange(e) {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;


    setForm((prev) => ({
      ...prev,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }



  async function handleSubmit(e) {
    e.preventDefault();


    try {
      setLoading(true);


      const token =
        localStorage.getItem("token");


      const response =
        await fetch(
          `${API_URL}/predictions`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },


            body: JSON.stringify({

              fixtureId:
                Date.now(),

              ...form,

              confidence:
                Number(form.confidence),

              odds:
                Number(form.odds),

              analysis:
                form.analysis
                  .split("\n")
                  .filter(Boolean),

            }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to create prediction"
        );
      }


      alert(
        "Prediction created successfully"
      );


      navigate(
        "/admin/predictions"
      );


    } catch (error) {

      console.error(error);

      alert(
        error.message
      );

    } finally {

      setLoading(false);

    }
  }



  return (
    <div className="admin-page">

      <h1>
        Create Prediction
      </h1>


      <form onSubmit={handleSubmit}>


        <input
          name="homeTeam"
          placeholder="Home Team"
          value={form.homeTeam}
          onChange={handleChange}
          required
        />


        <input
          name="awayTeam"
          placeholder="Away Team"
          value={form.awayTeam}
          onChange={handleChange}
          required
        />


        <input
          name="league"
          placeholder="League"
          value={form.league}
          onChange={handleChange}
          required
        />


        <input
          name="prediction"
          placeholder="Prediction e.g Over 1.5 Goals"
          value={form.prediction}
          onChange={handleChange}
          required
        />


        <input
          name="market"
          placeholder="Market e.g Over/Under"
          value={form.market}
          onChange={handleChange}
        />


        <input
          type="number"
          name="confidence"
          placeholder="Confidence %"
          value={form.confidence}
          onChange={handleChange}
          required
        />


        <input
          type="number"
          name="odds"
          placeholder="Odds"
          value={form.odds}
          onChange={handleChange}
        />


        <textarea
          name="analysis"
          placeholder="AI Analysis"
          rows="5"
          value={form.analysis}
          onChange={handleChange}
        />


        <select
          name="status"
          value={form.status}
          onChange={handleChange}
        >

          <option value="pending">
            Pending
          </option>

          <option value="won">
            Won
          </option>

          <option value="lost">
            Lost
          </option>

        </select>


        <label>

          <input
            type="checkbox"
            name="isPremium"
            checked={form.isPremium}
            onChange={handleChange}
          />

          Premium Prediction

        </label>


        <button disabled={loading}>

          {loading
            ? "Creating..."
            : "Create Prediction"}

        </button>


      </form>

    </div>
  );
}