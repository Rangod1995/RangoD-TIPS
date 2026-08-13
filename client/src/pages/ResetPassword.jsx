// ==========================================
// client/src/pages/ResetPassword.jsx
// RangoD TIPS V7
// ==========================================

import {
    useState
} from "react";

import {
    Link,
    useNavigate,
    useParams
} from "react-router-dom";

import {
    resetPassword
} from "../api/authApi";

import "./ResetPassword.css";

function ResetPassword() {

    const {
        token
    } = useParams();

    const navigate =
        useNavigate();

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    async function handleSubmit(
        event
    ) {

        event.preventDefault();

        setError("");
        setSuccess("");

        if (!token) {

            setError(
                "This password reset link is invalid."
            );

            return;
        }

        if (password.length < 6) {

            setError(
                "Password must be at least 6 characters."
            );

            return;
        }

        if (
            password !==
            confirmPassword
        ) {

            setError(
                "Passwords do not match."
            );

            return;
        }

        try {

            setLoading(true);

            const result =
                await resetPassword(
                    token,
                    password
                );

            setSuccess(
                result?.message ||
                "Password reset successfully."
            );

            // ==================================
            // Save returned login token
            // ==================================

            if (result?.token) {

                localStorage.setItem(
                    "token",
                    result.token
                );
            }

            if (result?.user) {

                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        result.user
                    )
                );
            }

            setTimeout(
                () => {
                    navigate(
                        "/login",
                        {
                            replace: true
                        }
                    );
                },
                1800
            );

        } catch (err) {

            console.error(
                "[ResetPassword]",
                err
            );

            setError(
                err?.message ||
                "Unable to reset password."
            );

        } finally {

            setLoading(false);
        }
    }

    return (
        <main className="reset-password-page">

            <div className="reset-password-card">

                <div className="reset-password-logo">
                    RangoD <span>TIPS</span>
                </div>

                <h1>
                    Create New Password
                </h1>

                <p className="reset-description">
                    Choose a strong new password
                    for your RangoD TIPS account.
                </p>

                {error && (
                    <div className="reset-error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="reset-success">
                        {success}
                    </div>
                )}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    <label htmlFor="password">
                        New Password
                    </label>

                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value
                            )
                        }
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        disabled={loading}
                    />

                    <label htmlFor="confirmPassword">
                        Confirm Password
                    </label>

                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(
                                event.target.value
                            )
                        }
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        disabled={loading}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Resetting..."
                            : "Reset Password"}
                    </button>

                </form>

                <Link
                    to="/login"
                    className="back-login"
                >
                    ← Back to Login
                </Link>

            </div>

        </main>
    );
}

export default ResetPassword;