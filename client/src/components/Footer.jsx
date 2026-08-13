import "./Footer.css";
import { NavLink } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="container">

        <div className="footer-grid">

          <div className="footer-column">
            <h2>
              <span>RangoD</span> TIPS
            </h2>

            <p>
              AI-powered football predictions, match analysis,
              live scores, and statistics designed to help football
              fans make informed decisions every day.
            </p>
          </div>

          <div className="footer-column">
            <h3>Quick Links</h3>

            <NavLink to="/">Home</NavLink>
            <NavLink to="/predictions">Predictions</NavLink>
            <NavLink to="/live">Live Matches</NavLink>
            <NavLink to="/pricing">Pricing</NavLink>
          </div>

          <div className="footer-column">
            <h3>Competitions</h3>

            <a href="#">Premier League</a>
            <a href="#">La Liga</a>
            <a href="#">Serie A</a>
            <a href="#">Bundesliga</a>
          </div>

          <div className="footer-column">
            <h3>Contact</h3>

            <p>Email</p>
            <a href="mailto:support@rangodtips.com">
              support@rangodtips.com
            </a>

            <p>Follow Us</p>

            <div className="social-icons">
              <a href="#">🌐</a>
              <a href="#">📘</a>
              <a href="#">📱</a>
              <a href="#">▶</a>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} RangoD TIPS. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;