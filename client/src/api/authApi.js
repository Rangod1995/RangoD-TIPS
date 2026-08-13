// ==========================================
// client/src/api/authApi.js
// RangoD TIPS V7 Enterprise
// Authentication API
// ==========================================

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";


// ==========================================
// GET STORED TOKEN
// ==========================================

export function getStoredToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        null
    );
}


// ==========================================
// STORE TOKEN
// ==========================================

export function setStoredToken(token) {
    if (!token) {
        return;
    }

    localStorage.setItem(
        "token",
        token
    );
}


// ==========================================
// REMOVE TOKEN
// ==========================================

export function removeStoredToken() {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
}


// ==========================================
// GENERIC API FETCH
// ==========================================

async function apiFetch(
    endpoint,
    options = {}
) {
    const token =
        getStoredToken();

    const headers = {
        ...(options.body
            ? {
                "Content-Type":
                    "application/json"
            }
            : {}),
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );
    } catch (error) {
        console.error(
            "[AuthAPI] Network error:",
            error
        );

        throw new Error(
            "Unable to connect to the server."
        );
    }

    let result = {};

    try {
        result =
            await response.json();
    } catch {
        result = {};
    }

    if (!response.ok) {
        throw new Error(
            result?.message ||
            result?.error ||
            `Request failed (${response.status}).`
        );
    }

    return result;
}


// ==========================================
// REGISTER USER
// ==========================================

export async function registerUser(
    name,
    email,
    password
) {
    const cleanName =
        String(name || "").trim();

    const cleanEmail =
        String(email || "")
            .trim()
            .toLowerCase();

    const cleanPassword =
        String(password || "");

    if (!cleanName) {
        throw new Error(
            "Name is required."
        );
    }

    if (!cleanEmail) {
        throw new Error(
            "Email is required."
        );
    }

    if (!cleanPassword) {
        throw new Error(
            "Password is required."
        );
    }

    const result =
        await apiFetch(
            "/auth/register",
            {
                method: "POST",

                body: JSON.stringify({
                    name:
                        cleanName,

                    email:
                        cleanEmail,

                    password:
                        cleanPassword
                })
            }
        );

    if (result?.token) {
        setStoredToken(
            result.token
        );
    }

    return result;
}


// ==========================================
// LOGIN USER
// ==========================================

export async function loginUser(
    email,
    password
) {
    const cleanEmail =
        String(email || "")
            .trim()
            .toLowerCase();

    const cleanPassword =
        String(password || "");

    console.log(
        "[AuthAPI] Login attempt:",
        {
            email:
                cleanEmail,
            passwordProvided:
                Boolean(cleanPassword)
        }
    );

    if (!cleanEmail) {
        throw new Error(
            "Email is required."
        );
    }

    if (!cleanPassword) {
        throw new Error(
            "Password is required."
        );
    }

    const result =
        await apiFetch(
            "/auth/login",
            {
                method: "POST",

                body: JSON.stringify({
                    email:
                        cleanEmail,

                    password:
                        cleanPassword
                })
            }
        );

    if (result?.token) {
        setStoredToken(
            result.token
        );
    }

    return result;
}


// ==========================================
// GET CURRENT USER
// ==========================================

export async function getCurrentUser() {
    const token =
        getStoredToken();

    if (!token) {
        return null;
    }

    try {
        const result =
            await apiFetch(
                "/auth/me",
                {
                    method: "GET"
                }
            );

        return (
            result?.user ||
            result?.data ||
            null
        );

    } catch (error) {
        console.error(
            "[AuthAPI] getCurrentUser:",
            error
        );

        return null;
    }
}


// ==========================================
// LOGOUT
// ==========================================

export function logoutUser() {
    removeStoredToken();
}


// ==========================================
// FORGOT PASSWORD
// ==========================================

export async function forgotPassword(
    email
) {
    const cleanEmail =
        String(email || "")
            .trim()
            .toLowerCase();

    if (!cleanEmail) {
        throw new Error(
            "Email address is required."
        );
    }

    return apiFetch(
        "/auth/forgot-password",
        {
            method: "POST",

            body: JSON.stringify({
                email:
                    cleanEmail
            })
        }
    );
}


// ==========================================
// RESET PASSWORD
// ==========================================

export async function resetPassword(
    token,
    password
) {
    const cleanToken =
        String(token || "").trim();

    const cleanPassword =
        String(password || "");

    if (!cleanToken) {
        throw new Error(
            "Password reset token is required."
        );
    }

    if (!cleanPassword) {
        throw new Error(
            "Password is required."
        );
    }

    return apiFetch(
        `/auth/reset-password/${encodeURIComponent(
            cleanToken
        )}`,
        {
            method: "POST",

            body: JSON.stringify({
                password:
                    cleanPassword
            })
        }
    );
}


// ==========================================
// CHANGE PASSWORD
// ==========================================

export async function changePassword(
    currentPassword,
    newPassword
) {
    const current =
        String(
            currentPassword || ""
        );

    const next =
        String(
            newPassword || ""
        );

    if (!current) {
        throw new Error(
            "Current password is required."
        );
    }

    if (!next) {
        throw new Error(
            "New password is required."
        );
    }

    return apiFetch(
        "/auth/change-password",
        {
            method: "POST",

            body: JSON.stringify({
                currentPassword:
                    current,

                newPassword:
                    next
            })
        }
    );
}


// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    registerUser,
    loginUser,
    getCurrentUser,
    getStoredToken,
    setStoredToken,
    removeStoredToken,
    logoutUser,
    forgotPassword,
    resetPassword,
    changePassword
};