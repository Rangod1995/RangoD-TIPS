// ==========================================
// server/controllers/authController.js
// RangoD TIPS V7 Enterprise
// Authentication Controller
// ==========================================

import crypto from "crypto";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

// ==========================================
// JWT SECRET
// ==========================================

function getJwtSecret() {

    const secret =
        process.env.JWT_SECRET ||
        process.env.JWT_SECRET_KEY;

    if (!secret) {

        throw new Error(
            "JWT_SECRET is not configured."
        );
    }

    return secret;
}

// ==========================================
// CREATE TOKEN
// ==========================================

function createToken(
    userId
) {

    return jwt.sign(
        {
            id: String(userId)
        },
        getJwtSecret(),
        {
            expiresIn:
                process.env.JWT_EXPIRES_IN ||
                "7d"
        }
    );
}

// ==========================================
// SANITIZE USER
// ==========================================

function sanitizeUser(
    user
) {

    if (!user) {
        return null;
    }

    const data =
        typeof user.toObject ===
        "function"
            ? user.toObject()
            : {
                ...user
            };

    delete data.password;
    delete data.passwordHash;

    delete data.resetPasswordToken;
    delete data.resetPasswordExpires;
    delete data.resetPasswordExpire;

    return data;
}

// ==========================================
// REQUEST USER ID
// ==========================================

function getRequestUserId(
    req
) {

    return (
        req?.user?._id ||
        req?.user?.id ||
        req?.user?.userId
    );
}

// ==========================================
// REGISTER
// ==========================================

export async function register(
    req,
    res
) {

    try {

        const {
            name,
            email,
            password
        } = req.body || {};

        if (
            !name ||
            !email ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Name, email and password are required."
            });
        }

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const cleanPassword =
            String(password);

        if (
            cleanPassword.length < 6
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters."
            });
        }

        const existingUser =
            await User.findOne({
                email:
                    normalizedEmail
            });

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists."
            });
        }

        // IMPORTANT:
        // Do NOT bcrypt.hash() here.
        //
        // User.js pre-save hook handles
        // hashing exactly once.

        const user =
            await User.create({
                name:
                    String(name).trim(),

                email:
                    normalizedEmail,

                password:
                    cleanPassword
            });

        const token =
            createToken(
                user._id
            );

        return res.status(201).json({

            success: true,

            message:
                "Account created successfully.",

            token,

            user:
                sanitizeUser(user)
        });

    } catch (error) {

        console.error(
            "[AuthController] register:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Registration failed."
        });
    }
}

// ==========================================
// LOGIN
// ==========================================

export async function login(
    req,
    res
) {

    try {

        const {
            email,
            password
        } = req.body || {};

        if (
            !email ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required."
            });
        }

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        // IMPORTANT:
        // password has select:false,
        // so explicitly select it.
        const user =
            await User.findOne({
                email:
                    normalizedEmail
            })
            .select("+password");

        if (!user) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        if (!user.password) {

            return res.status(500).json({
                success: false,
                message:
                    "User password is not configured correctly."
            });
        }

        const passwordMatches =
            await user.comparePassword(
                String(password)
            );

        if (!passwordMatches) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        const token =
            createToken(
                user._id
            );

        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            token,

            user:
                sanitizeUser(user)
        });

    } catch (error) {

        console.error(
            "[AuthController] login:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Login failed."
        });
    }
}

// ==========================================
// GET CURRENT USER
// ==========================================

export async function getMe(
    req,
    res
) {

    try {

        const userId =
            getRequestUserId(req);

        if (!userId) {

            return res.status(401).json({
                success: false,
                message:
                    "Not authenticated."
            });
        }

        const user =
            await User.findById(
                userId
            ).lean();

        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });
        }

        const safeUser =
            sanitizeUser(user);

        return res.status(200).json({

            success: true,

            user:
                safeUser,

            data:
                safeUser
        });

    } catch (error) {

        console.error(
            "[AuthController] getMe:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to load user."
        });
    }
}

// ==========================================
// FORGOT PASSWORD
// ==========================================

export async function forgotPassword(
    req,
    res
) {

    try {

        const email =
            String(
                req.body?.email || ""
            )
                .trim()
                .toLowerCase();

        if (!email) {

            return res.status(400).json({
                success: false,
                message:
                    "Email address is required."
            });
        }

        const user =
            await User.findOne({
                email
            })
            .select(
                "+resetPasswordToken +resetPasswordExpires"
            );

        // Security:
        // Don't reveal whether an email
        // exists in the database.
        if (!user) {

            return res.status(200).json({

                success: true,

                message:
                    "If an account exists with that email, password reset instructions have been generated."
            });
        }

        const rawToken =
            crypto
                .randomBytes(32)
                .toString("hex");

        const hashedToken =
            crypto
                .createHash("sha256")
                .update(rawToken)
                .digest("hex");

        user.resetPasswordToken =
            hashedToken;

        user.resetPasswordExpires =
            new Date(
                Date.now() +
                15 * 60 * 1000
            );

        await user.save({
            validateBeforeSave: false
        });

        const frontendUrl =
            process.env.CLIENT_URL ||
            process.env.FRONTEND_URL ||
            "http://localhost:5173";

        const resetUrl =
            `${frontendUrl}/reset-password/${rawToken}`;

        console.log(
            "=========================================="
        );

        console.log(
            "[AuthController] PASSWORD RESET URL:"
        );

        console.log(
            resetUrl
        );

        console.log(
            "=========================================="
        );

        return res.status(200).json({

            success: true,

            message:
                "If an account exists with that email, password reset instructions have been generated.",

            ...(process.env.NODE_ENV !==
                "production"
                ? {
                    resetToken:
                        rawToken,

                    resetUrl
                }
                : {})
        });

    } catch (error) {

        console.error(
            "[AuthController] forgotPassword:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to process password reset request."
        });
    }
}

// ==========================================
// RESET PASSWORD
// ==========================================

export async function resetPassword(
    req,
    res
) {

    try {

        const token =
            String(
                req.params.token ||
                req.body?.token ||
                ""
            ).trim();

        const newPassword =
            String(
                req.body?.password ||
                req.body?.newPassword ||
                ""
            );

        if (!token) {

            return res.status(400).json({
                success: false,
                message:
                    "Password reset token is required."
            });
        }

        if (
            newPassword.length < 6
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters."
            });
        }

        const hashedToken =
            crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");

        const user =
            await User.findOne({
                resetPasswordToken:
                    hashedToken,

                resetPasswordExpires: {
                    $gt: new Date()
                }
            })
            .select(
                "+password +resetPasswordToken +resetPasswordExpires"
            );

        if (!user) {

            return res.status(400).json({
                success: false,
                message:
                    "Password reset token is invalid or has expired."
            });
        }

        // IMPORTANT:
        // Do NOT bcrypt.hash() here.
        // User.js pre-save hook hashes once.
        user.password =
            newPassword;

        user.resetPasswordToken =
            undefined;

        user.resetPasswordExpires =
            undefined;

        await user.save();

        return res.status(200).json({

            success: true,

            message:
                "Password reset successfully. You can now log in with your new password."
        });

    } catch (error) {

        console.error(
            "[AuthController] resetPassword:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to reset password."
        });
    }
}

// ==========================================
// CHANGE PASSWORD
// ==========================================

export async function changePassword(
    req,
    res
) {

    try {

        const userId =
            getRequestUserId(req);

        if (!userId) {

            return res.status(401).json({
                success: false,
                message:
                    "Not authenticated."
            });
        }

        const {
            currentPassword,
            newPassword
        } = req.body || {};

        if (
            !currentPassword ||
            !newPassword
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Current password and new password are required."
            });
        }

        if (
            String(newPassword).length < 6
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "New password must be at least 6 characters."
            });
        }

        const user =
            await User.findById(
                userId
            )
            .select("+password");

        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });
        }

        const matches =
            await user.comparePassword(
                String(currentPassword)
            );

        if (!matches) {

            return res.status(401).json({
                success: false,
                message:
                    "Current password is incorrect."
            });
        }

        // Do NOT hash manually.
        user.password =
            String(newPassword);

        await user.save();

        return res.status(200).json({

            success: true,

            message:
                "Password changed successfully."
        });

    } catch (error) {

        console.error(
            "[AuthController] changePassword:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to change password."
        });
    }
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {

    register,

    login,

    getMe,

    forgotPassword,

    resetPassword,

    changePassword
};