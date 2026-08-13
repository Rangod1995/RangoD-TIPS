// ==========================================
// client/src/context/AuthContext.jsx
// RangoD TIPS V7 Enterprise
// Authentication Context
// ==========================================

import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    loginUser,
    registerUser,
    logoutUser,
    getCurrentUser,
    getStoredToken
} from "../api/authApi.js";

// ==========================================
// CONTEXT
// ==========================================

const AuthContext = createContext(null);

// ==========================================
// PROVIDER
// ==========================================

export function AuthProvider({ children }) {

    const [user, setUser] =
        useState(null);

    const [token, setToken] =
        useState(null);

    const [loading, setLoading] =
        useState(true);


    // ==========================================
    // INITIALIZE AUTH
    // ==========================================

    useEffect(() => {

        let mounted = true;

        async function initializeAuth() {

            try {

                const savedToken =
                    getStoredToken();

                // ----------------------------------
                // No token
                // ----------------------------------

                if (!savedToken) {

                    if (mounted) {
                        setUser(null);
                        setToken(null);
                    }

                    return;
                }


                // ----------------------------------
                // Validate token / load user
                // ----------------------------------

                const currentUser =
                    await getCurrentUser();


                if (!mounted) {
                    return;
                }


                if (currentUser) {

                    setUser(currentUser);
                    setToken(savedToken);

                } else {

                    logoutUser();

                    setUser(null);
                    setToken(null);

                }

            } catch (error) {

                console.error(
                    "[AuthContext] Authentication initialization failed:",
                    error
                );

                if (mounted) {

                    logoutUser();

                    setUser(null);
                    setToken(null);

                }

            } finally {

                if (mounted) {
                    setLoading(false);
                }

            }
        }


        initializeAuth();


        return () => {
            mounted = false;
        };

    }, []);


    // ==========================================
    // LOGIN
    // ==========================================

    async function login(
        email,
        password
    ) {

        const cleanEmail =
            String(email || "")
                .trim();

        const cleanPassword =
            String(password || "");


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


        console.log(
            "[AuthContext] Logging in:",
            cleanEmail
        );


        /*
         * IMPORTANT:
         *
         * Send email and password as
         * separate arguments.
         *
         * This matches the loginUser()
         * implementation expected by the
         * current authApi.js.
         */

        const result =
            await loginUser(
                cleanEmail,
                cleanPassword
            );


        if (!result) {
            throw new Error(
                "Login failed. No response received."
            );
        }


        const authenticatedUser =
            result.user ||
            result.data?.user ||
            null;


        const authenticatedToken =
            result.token ||
            result.data?.token ||
            null;


        if (!authenticatedToken) {

            throw new Error(
                "Login succeeded but no authentication token was returned."
            );

        }


        if (!authenticatedUser) {

            throw new Error(
                "Login succeeded but no user account was returned."
            );

        }


        setUser(
            authenticatedUser
        );

        setToken(
            authenticatedToken
        );


        return {
            ...result,
            user:
                authenticatedUser,
            token:
                authenticatedToken
        };
    }


    // ==========================================
    // REGISTER
    // ==========================================

    async function register(
        name,
        email,
        password
    ) {

        const cleanName =
            String(name || "")
                .trim();

        const cleanEmail =
            String(email || "")
                .trim();

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
            await registerUser(
                cleanName,
                cleanEmail,
                cleanPassword
            );


        if (!result) {
            throw new Error(
                "Registration failed. No response received."
            );
        }


        const registeredUser =
            result.user ||
            result.data?.user ||
            null;


        const registeredToken =
            result.token ||
            result.data?.token ||
            null;


        if (!registeredToken) {

            throw new Error(
                "Registration succeeded but no authentication token was returned."
            );

        }


        if (!registeredUser) {

            throw new Error(
                "Registration succeeded but no user account was returned."
            );

        }


        setUser(
            registeredUser
        );

        setToken(
            registeredToken
        );


        return {
            ...result,
            user:
                registeredUser,
            token:
                registeredToken
        };
    }


    // ==========================================
    // LOGOUT
    // ==========================================

    function logout() {

        try {
            logoutUser();
        } catch (error) {

            console.error(
                "[AuthContext] Logout error:",
                error
            );

        }


        setUser(null);
        setToken(null);
    }


    // ==========================================
    // AUTH STATE
    // ==========================================

    const isAuthenticated =
        Boolean(
            token &&
            user
        );


    // ==========================================
    // PROVIDER
    // ==========================================

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,

                login,
                register,
                logout,

                isAuthenticated
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}


// ==========================================
// HOOK
// ==========================================

/* eslint-disable react-refresh/only-export-components */

export function useAuth() {

    return useContext(
        AuthContext
    );

}