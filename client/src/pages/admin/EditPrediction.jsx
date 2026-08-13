import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function EditPrediction() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    prediction: "",
    market: "",
    confidence: "",
    odds: "",
    analysis: "",
    isPremium: false,
    status: "pending",
  });

  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadPrediction();
  }, []);


  async function loadPrediction() {
    try {
      const res = await fetch(
        `${API_URL}/predictions/${id}`
      );

      const data = await res.json();

      const p = data.prediction;


      let predictionValue = "";

      if (typeof p.prediction === "object") {
        predictionValue =
          p.prediction.value ||
          p.prediction.name ||
          JSON.stringify(p.prediction);
      } else {
        predictionValue = p.prediction || "";
      }


      setForm({
        prediction: predictionValue,

        market:
          p.market || "",

        confidence:
          p.confidence || "",

        odds:
          p.odds || "",

        analysis:
          Array.isArray(p.analysis)
            ? p.analysis.join("\n")
            : "",

        isPremium:
          p.isPremium || false,

        status:
          p.status || "pending",
      });


    } catch (error) {
      console.error(
        "Load prediction error:",
        error
      );

    } finally {
      setLoading(false);
    }
  }



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


    const token =
      localStorage.getItem("token");


    try {

      const res = await fetch(
        `${API_URL}/predictions/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },


          body: JSON.stringify({

            ...form,

            confidence:
              Number(form.confidence),

            analysis:
              form.analysis
                .split("\n")
                .filter(Boolean),

          }),
        }
      );


      if (!res.ok) {
        throw new Error(
          "Update failed"
        );
      }


      alert(
        "Prediction updated successfully"
      );


      navigate(
        "/admin/predictions"
      );


    } catch (error) {

      console.error(error);

      alert(
        error.message
      );

    }
  }



  if (loading) {
    return (
      <h2>
        Loading prediction...
      </h2>
    );
  }



  return (
    <div className="admin-page">

      <h1>
        Edit Prediction
      </h1>


      <form onSubmit={handleSubmit}>


        <label>
          Prediction
        </label>

        <input
          name="prediction"
          value={form.prediction}
          onChange={handleChange}
        />



        <label>
          Market
        </label>

        <input
          name="market"
          value={form.market}
          onChange={handleChange}
        />



        <label>
          Confidence %
        </label>

        <input
          type="number"
          name="confidence"
          value={form.confidence}
          onChange={handleChange}
        />



        <label>
          Odds
        </label>

        <input
          type="number"
          name="odds"
          value={form.odds}
          onChange={handleChange}
        />



        <label>
          Status
        </label>

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

          <option value="void">
            Void
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



        <label>
          Analysis
        </label>


        <textarea
          name="analysis"
          rows="6"
          value={form.analysis}
          onChange={handleChange}
        />



        <button type="submit">
          Save Changes
        </button>


        <button
          type="button"
          onClick={() =>
            navigate(
              "/admin/predictions"
            )
          }
        >
          Back
        </button>


      </form>

    </div>
  );
}
