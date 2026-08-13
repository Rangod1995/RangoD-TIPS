import "./Features.css";

const features = [
  {
    id: 1,
    icon: "🤖",
    title: "AI Match Analysis",
    description:
      "Our AI evaluates team form, head-to-head records, injuries, recent performances, and other key statistics to generate informed predictions.",
  },
  {
    id: 2,
    icon: "⚡",
    title: "Live Match Updates",
    description:
      "Stay up to date with live scores, match status, and important events as they happen throughout the day.",
  },
  {
    id: 3,
    icon: "📊",
    title: "Advanced Statistics",
    description:
      "Access detailed football statistics including form, possession trends, goals, and performance metrics to support your decisions.",
  },
  {
    id: 4,
    icon: "🎯",
    title: "Daily Predictions",
    description:
      "Receive fresh AI-powered predictions every day across the world's leading football competitions.",
  },
];

function Features() {
  return (
    <section className="features">
      <div className="container">

        <div className="section-header">
          <span className="section-badge">
            WHY RANGOD TIPS
          </span>

          <h2>Powerful Features</h2>

          <p>
            Everything you need to follow football with intelligent
            analysis, reliable insights, and an intuitive experience.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <div className="feature-card" key={feature.id}>

              <div className="feature-icon">
                {feature.icon}
              </div>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default Features;