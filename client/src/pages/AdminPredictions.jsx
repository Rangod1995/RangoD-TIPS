import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AdminPredictions() {
  const navigate = useNavigate();

  const [predictions, setPredictions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPredictions();
  }, []);

  async function loadPredictions() {
    try {
      const res = await fetch(`${API_URL}/predictions?limit=100`);
      const data = await res.json();

      setPredictions(data.predictions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }


  async function deletePrediction(id) {
    if (!window.confirm("Delete this prediction?")) return;

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${API_URL}/predictions/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      if (res.ok) {
        setPredictions((prev) =>
          prev.filter((p) => p._id !== id)
        );

        alert("Prediction deleted successfully.");
      } else {
        alert("Delete failed.");
      }

    } catch (err) {
      console.error(err);
    }
  }


  const filtered = predictions.filter((p) => {
    const text = search.toLowerCase();

    return (
      p.homeTeam?.toLowerCase().includes(text) ||
      p.awayTeam?.toLowerCase().includes(text) ||
      p.league?.toLowerCase().includes(text)
    );
  });


  if (loading) {
    return <h2>Loading...</h2>;
  }


  return (
    <div className="admin-predictions">

      <div className="page-header">

        <div>
          <h1>Prediction Management</h1>
          <p>Create, edit and manage AI predictions.</p>
        </div>


        <Link
          className="create-btn"
          to="/admin/create-prediction"
        >
          + Create Prediction
        </Link>

      </div>


      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />


      <table>

        <thead>
          <tr>
            <th>Match</th>
            <th>League</th>
            <th>Prediction</th>
            <th>Confidence</th>
            <th>Premium</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>


        <tbody>

          {filtered.map((prediction) => (

            <tr key={prediction._id}>

              <td>
                {prediction.homeTeam} vs{" "}
                {prediction.awayTeam}
              </td>


              <td>
                {prediction.league}
              </td>


              <td>
  {
    typeof prediction.prediction === "object"
      ? prediction.prediction.type ||
        JSON.stringify(prediction.prediction)
      : prediction.prediction
  }
</td>


              <td>
                {prediction.confidence}%
              </td>


              <td>
                {prediction.isPremium
                  ? "✅"
                  : "❌"}
              </td>


              <td>
                {prediction.status}
              </td>


              <td>

                <button
                  className="edit-btn"
                  onClick={() =>
                    navigate(
                      `/admin/predictions/edit/${prediction._id}`
                    )
                  }
                >
                  Edit
                </button>


                <button
                  className="delete-btn"
                  onClick={() =>
                    deletePrediction(
                      prediction._id
                    )
                  }
                >
                  Delete
                </button>


              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}
