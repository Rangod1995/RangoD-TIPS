function CategoryCard({ icon, title, description }) {
  return (
    <div className="category-card">
      <div className="category-icon">{icon}</div>

      <h3>{title}</h3>

      <p>{description}</p>

      <button>Explore</button>
    </div>
  );
}

export default CategoryCard;