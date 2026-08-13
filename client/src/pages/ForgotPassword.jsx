// ==========================================
// client/src/pages/ForgotPassword.jsx
// RangoD TIPS V7 Enterprise
// Forgot Password
// ==========================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/authApi.js";
import "./Auth.css";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setMessage("");
        setError("");

        const normalizedEmail =
            email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError(
                "Please enter your email address."
            );
            return;
        }

        setIsLoading(true);

        try {
            const result =
                await forgotPassword(
                    normalizedEmail
                );

            setMessage(
                result?.message ||
                "If an account exists with that email, password reset instructions have been generated."
            );

            // Development mode:
            // Show reset URL returned by backend.
            if (result?.resetUrl) {
                setMessage(
                    `${result.message || "Password reset instructions generated."}`
                );

                console.log(
                    "[ForgotPassword] Reset URL:",
                    result.resetUrl
                );
            }

        } catch (err) {
            console.error(
                "[ForgotPassword] Error:",
                err
            );

            setError(
                err?.message ||
                "Unable to process password reset request."
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="auth-page">

            <div className="auth-container">

                <div className="auth-logo">
                    RangoD TIPS
                </div>

                <h1>
                    Forgot Password?
                </h1>

                <p className="auth-subtitle">
                    Enter your email address and
                    we'll help you reset your password.
                </p>

                <form
                    onSubmit={handleSubmit}
                >

                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        autoComplete="email"
                        required
                    />

                    {error && (
                        <p
                            style={{
                                color: "#ff7b7b",
                                marginTop: "10px"
                            }}
                        >
                            {error}
                        </p>
                    )}

                    {message && (
                        <div
                            style={{
                                color: "#22c55e",
                                background:
                                    "rgba(34,197,94,0.10)",
                                border:
                                    "1px solid rgba(34,197,94,0.30)",
                                padding: "12px",
                                borderRadius: "8px",
                                marginTop: "10px",
                                marginBottom: "10px",
                                fontSize: "14px",
                                lineHeight: "1.5"
                            }}
                        >
                            {message}

                            <p
                                style={{
                                    marginTop: "8px",
                                    marginBottom: 0
                                }}
                            >
                                Check your email for
                                password reset
                                instructions.
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Processing..."
                            : "Reset Password"}
                    </button>

                </form>

                <p
                    style={{
                        marginTop: "20px"
                    }}
                >
                    Remember your password?{" "}

                    <Link to="/login">
                        Back to Login
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default ForgotPassword;