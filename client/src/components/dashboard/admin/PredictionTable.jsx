import "./PredictionTable.css";

function PredictionTable({
  predictions,
  loading,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="prediction-table-loading">
        <h2>Loading predictions...</h2>
      </div>
    );
  }

  if (!predictions.length) {
    return (
      <div className="prediction-table-empty">
        <h2>No predictions found.</h2>
      </div>
    );
  }

  return (
    <div className="prediction-table-wrapper">

      <table className="prediction-table">

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

          {predictions.map((prediction) => (

            <tr key={prediction._id}>

              <td>
                <strong>
                  {prediction.homeTeam}
                </strong>

                <br />

                <small>
                  vs {prediction.awayTeam}
                </small>
              </td>

              <td>
                {prediction.league}
              </td>

              <td>
                {prediction.prediction || "-"}
              </td>

              <td>

                <span className="confidence-badge">
                  {prediction.confidence}%
                </span>

              </td>

              <td>

                {prediction.isPremium ? (

                  <span className="premium yes">
                    Premium
                  </span>

                ) : (

                  <span className="premium no">
                    Free
                  </span>

                )}

              </td>

              <td>

                <span
                  className={`status ${prediction.status?.toLowerCase()}`}
                >
                  {prediction.status}
                </span>

              </td>

              <td>

                <button
                  className="edit-btn"
                  onClick={() => onEdit(prediction)}
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => onDelete(prediction)}
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

export default PredictionTable;