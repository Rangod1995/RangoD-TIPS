// ==========================================
// client/src/components/Login.jsx
// RangoD TIPS V7 Enterprise
// Login
// ==========================================

import "./Auth.css";

import {
    useState
} from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    useAuth
} from "../context/AuthContext";

// ==========================================
// COMPONENT
// ==========================================

function Login() {

    const navigate =
        useNavigate();

    const {
        login
    } = useAuth();

    // ======================================
    // STATE
    // ======================================

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [error, setError] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(false);

    // ======================================
    // HANDLE CHANGE
    // ======================================

    function handleChange(e) {

        const {
            name,
            value
        } = e.target;

        setForm(
            previous => ({
                ...previous,
                [name]: value
            })
        );
    }

    // ======================================
    // HANDLE LOGIN
    // ======================================

    async function handleLogin(e) {

        e.preventDefault();

        setError("");

        // ----------------------------------
        // Basic validation
        // ----------------------------------

        const email =
            form.email.trim();

        const password =
            form.password;

        if (!email) {

            setError(
                "Please enter your email address."
            );

            return;
        }

        if (!password) {

            setError(
                "Please enter your password."
            );

            return;
        }

        setIsLoading(true);

        try {

            await login(
                email,
                password
            );

            navigate(
                "/dashboard"
            );

        } catch (error) {

            console.error(
                "[Login] Login failed:",
                error
            );

            setError(
                error?.message ||
                "Login failed. Please check your email and password."
            );

        } finally {

            setIsLoading(false);
        }
    }

    // ======================================
    // RENDER
    // ======================================

    return (
        <div className="auth-page">

            <div className="auth-container">

                {/* ==========================
                    LOGO
                ========================== */}

                <div className="auth-logo">
                    RangoD TIPS
                </div>

                {/* ==========================
                    TITLE
                ========================== */}

                <h1>
                    Login to RangoD TIPS
                </h1>

                <p className="auth-subtitle">
                    Sign in to access your
                    predictions and account.
                </p>

                {/* ==========================
                    LOGIN FORM
                ========================== */}

                <form
                    onSubmit={handleLogin}
                    noValidate
                >

                    {/* ======================
                        EMAIL
                    ====================== */}

                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        autoComplete="email"
                        disabled={isLoading}
                        required
                    />

                    {/* ======================
                        PASSWORD
                    ====================== */}

                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        disabled={isLoading}
                        required
                    />

                    {/* ======================
                        FORGOT PASSWORD
                    ====================== */}

                    <div className="forgot-password-link">

                        <Link
                            to="/forgot-password"
                        >
                            Forgot Password?
                        </Link>

                    </div>

                    {/* ======================
                        ERROR
                    ====================== */}

                    {error && (

                        <p
                            className="auth-error"
                            role="alert"
                        >
                            {error}
                        </p>

                    )}

                    {/* ======================
                        LOGIN BUTTON
                    ====================== */}

                    <button
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Signing in..."
                            : "Login"}
                    </button>

                </form>

                {/* ==========================
                    REGISTER
                ========================== */}

                <p>

                    Don&apos;t have an account?{" "}

                    <Link to="/register">
                        Register
                    </Link>

                </p>

            </div>

        </div>
    );
}

export default Login;