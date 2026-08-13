import { FaBrain } from "react-icons/fa";
const analysisItems = [
  {
    icon: "📊",
    title: "Team Form",
    description:
      "Analyze recent performances, winning streaks, and consistency."
  },
  {
    icon: "⚽",
    title: "Head-to-Head",
    description:
      "Compare previous meetings to identify historical trends."
  },
  {
    icon: "🚑",
    title: "Injuries & Suspensions",
    description:
      "Factor in unavailable players and squad depth."
  },
  {
    icon: "📈",
    title: "Advanced Statistics",
    description:
      "Expected Goals (xG), possession, shots, and defensive efficiency."
  },
  {
    icon: "🌦️",
    title: "Match Conditions",
    description:
      "Weather, venue, travel, and home advantage."
  },
  {
    icon: "🤖",
    title: "AI Prediction Engine",
    description:
      "Machine learning combines all available data to generate predictions."
  }
];

function AIAnalysis() {
  return (
    <section className="analysis">
      <div className="section-header">
        <h2>
   <FaBrain />
   AI Match Intelligence
</h2>

        <p>
          Every prediction is generated after analyzing multiple football data
          points—not random guesses.
        </p>
      </div>

      <div className="analysis-grid">
        {analysisItems.map((item) => (
          <div className="analysis-card" key={item.title}>
            <div className="analysis-icon">{item.icon}</div>

            <h3>{item.title}</h3>

            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AIAnalysis;