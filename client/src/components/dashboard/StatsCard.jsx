import "./Dashboard.css";

function StatsCard({
  title,
  value,
  icon: Icon,
  color = "blue",
}) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-top">
        <div className={`stat-icon-wrapper ${color}`}>
          <Icon className="stat-icon" />
        </div>
      </div>

      <h2>{value}</h2>

      <h3>{title}</h3>
    </div>
  );
}

export default StatsCard;