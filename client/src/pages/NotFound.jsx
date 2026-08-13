import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="auth-container" style={{ minHeight: "60vh" }}>
      <h1>Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Go back home</Link>
    </section>
  );
}

export default NotFound;