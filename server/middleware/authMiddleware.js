// ==========================================
// server/middleware/authMiddleware.js
// RangoD TIPS V7 Enterprise
// Authentication & Authorization Middleware
// ==========================================

import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import User from "../models/User.js";

// ==========================================
// Get User ID From JWT
// Supports common JWT field names
// ==========================================

function getUserId(decoded) {
  return (
    decoded?.userId ||
    decoded?.id ||
    decoded?._id ||
    decoded?.user?.id ||
    decoded?.user?._id ||
    null
  );
}

// ==========================================
// Protect Routes
// ==========================================

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (
      !header ||
      !header.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = header.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    // ========================================
    // Verify JWT
    // ========================================

    const decoded = jwt.verify(
      token,
      config.jwtSecret
    );

    // ========================================
    // Find User
    // ========================================

    const userId = getUserId(decoded);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const user = await User.findById(userId).select(
      "-password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    // ========================================
    // Attach Complete User To Request
    // ========================================

    req.user = user;

    next();

  } catch (error) {
    console.error(
      "[AuthMiddleware] Authentication error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

// ==========================================
// Admin Only
// MUST run after protect
// ==========================================

export function adminOnly(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Support both Mongoose document
    // and plain JWT/object values
    const role =
      req.user.role ||
      req.user.user?.role;

    if (role !== "admin") {
      console.warn(
        `[AuthMiddleware] Admin access denied for user: ${
          req.user.email ||
          req.user.id ||
          req.user._id ||
          "unknown"
        }`
      );

      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    next();

  } catch (error) {
    console.error(
      "[AuthMiddleware] Admin authorization error:",
      error.message
    );

    return res.status(403).json({
      success: false,
      message: "Admin access denied",
    });
  }
}

// ==========================================
// Optional Authentication
// ==========================================

export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (
      header &&
      header.startsWith("Bearer ")
    ) {
      const token = header.split(" ")[1];

      if (token) {
        const decoded = jwt.verify(
          token,
          config.jwtSecret
        );

        const userId = getUserId(decoded);

        if (userId) {
          const user = await User.findById(
            userId
          ).select("-password");

          if (user) {
            req.user = user;
          }
        }
      }
    }

    next();

  } catch (error) {
    req.user = null;
    next();
  }
}

// ==========================================
// Default Export
// ==========================================

export default {
  protect,
  adminOnly,
  optionalAuth,
};