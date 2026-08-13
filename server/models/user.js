// ==========================================
// server/models/User.js
// RangoD TIPS V7 Enterprise
// User Model
// ==========================================

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ==========================================
// USER SCHEMA
// ==========================================

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            default: ""
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false
        },

        subscription: {
            type: String,
            enum: [
                "free",
                "premium"
            ],
            default: "free"
        },

        isPremium: {
            type: Boolean,
            default: false
        },

        resetPasswordToken: {
            type: String,
            default: undefined,
            select: false
        },

        resetPasswordExpires: {
            type: Date,
            default: undefined,
            select: false
        }
    },
    {
        timestamps: true
    }
);

// ==========================================
// HASH PASSWORD
// ==========================================
//
// IMPORTANT:
// Controllers should pass the plain password.
// This hook hashes it exactly ONCE.
// ==========================================

userSchema.pre(
    "save",
    async function (next) {

        try {

            if (
                !this.isModified(
                    "password"
                )
            ) {
                return next();
            }

            const salt =
                await bcrypt.genSalt(12);

            this.password =
                await bcrypt.hash(
                    this.password,
                    salt
                );

            next();

        } catch (error) {

            next(error);
        }
    }
);

// ==========================================
// COMPARE PASSWORD
// ==========================================

userSchema.methods.comparePassword =
    async function (
        candidatePassword
    ) {

        if (
            !candidatePassword ||
            !this.password
        ) {
            return false;
        }

        return bcrypt.compare(
            candidatePassword,
            this.password
        );
    };

// ==========================================
// GENERATE PASSWORD RESET TOKEN
// ==========================================

userSchema.methods.generatePasswordResetToken =
    function () {

        const rawToken =
            crypto
                .randomBytes(32)
                .toString("hex");

        this.resetPasswordToken =
            crypto
                .createHash("sha256")
                .update(rawToken)
                .digest("hex");

        this.resetPasswordExpires =
            new Date(
                Date.now() +
                15 * 60 * 1000
            );

        return rawToken;
    };

// ==========================================
// CLEAR PASSWORD RESET TOKEN
// ==========================================

userSchema.methods.clearPasswordResetToken =
    function () {

        this.resetPasswordToken =
            undefined;

        this.resetPasswordExpires =
            undefined;
    };

// ==========================================
// MODEL
// ==========================================

export default mongoose.model(
    "User",
    userSchema
);