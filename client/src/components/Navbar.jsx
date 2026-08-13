// client/src/components/Navbar.jsx

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    user,
    logout,
    isAuthenticated,
  } = useAuth();

  const navigate = useNavigate();

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Support different possible role formats
  const userRole = String(
    user?.role ||
      user?.userRole ||
      user?.accountType ||
      ""
  ).toLowerCase();

  const isAdmin =
    userRole === "admin" ||
    user?.isAdmin === true ||
    user?.admin === true;

  function handleLogout() {
    logout();
    closeMenu();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="container navbar-container">

        {/* ======================================
            LOGO
        ======================================= */}

        <NavLink
          to="/"
          className="logo"
          onClick={closeMenu}
        >
          <span className="logo-highlight">
            RangoD
          </span>{" "}
          TIPS
        </NavLink>


        {/* ======================================
            NAVIGATION
        ======================================= */}

        <nav
          className={`nav-links ${
            menuOpen ? "open" : ""
          }`}
        >

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "active-link"
                : ""
            }
            onClick={closeMenu}
          >
            Home
          </NavLink>


          <NavLink
            to="/predictions"
            className={({ isActive }) =>
              isActive
                ? "active-link"
                : ""
            }
            onClick={closeMenu}
          >
            Predictions
          </NavLink>


          <NavLink
            to="/pricing"
            className={({ isActive }) =>
              isActive
                ? "active-link"
                : ""
            }
            onClick={closeMenu}
          >
            Pricing
          </NavLink>


          {/* DASHBOARD */}

          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive
                  ? "active-link"
                  : ""
              }
              onClick={closeMenu}
            >
              Dashboard
            </NavLink>
          )}


          {/* ADMIN */}

          {isAuthenticated && isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive
                  ? "active-link admin-link"
                  : "admin-link"
              }
              onClick={closeMenu}
            >
              Admin
            </NavLink>
          )}

        </nav>


        {/* ======================================
            RIGHT SIDE
        ======================================= */}

        <div className="nav-buttons">

          {isAuthenticated ? (
            <>

              <span
                style={{
                  color: "#fff",
                  marginRight: "10px",
                  fontWeight: "500",
                }}
              >
                Hi,{" "}
                {user?.name ||
                  user?.email ||
                  "Member"}
              </span>


              <button
                type="button"
                className="login-btn"
                onClick={handleLogout}
              >
                Logout
              </button>

            </>
          ) : (
            <>

              <NavLink
                to="/login"
                className="login-btn"
                onClick={closeMenu}
              >
                Login
              </NavLink>


              <NavLink
                to="/register"
                className="start-btn"
                onClick={closeMenu}
              >
                Get Started
              </NavLink>

            </>
          )}

        </div>


        {/* ======================================
            MOBILE MENU
        ======================================= */}

        <button
          type="button"
          className="menu-toggle"
          onClick={() =>
            setMenuOpen(
              (previous) => !previous
            )
          }
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

      </div>
    </header>
  );
}

export default Navbar;