
// ==========================================
// server/config/database.js
// RangoD AI Engine V7 Enterprise
// MongoDB Database Connection
// ==========================================

import mongoose from "mongoose";
import { setServers } from "node:dns";
import { config } from "./env.js";

// ==========================================
// Node.js DNS Configuration
// ==========================================

setServers([
    "8.8.8.8",
    "8.8.4.4"
]);

// ==========================================
// Connect Database
// ==========================================

export async function connectDB() {

    try {

        await mongoose.connect(
            config.mongoUri
        );

        console.log("MongoDB Connected");

    } catch (error) {

        console.error(
            "MongoDB Connection Error:",
            error.message
        );

        process.exit(1);
    }
}

// ==========================================
// Alias compatibility
// ==========================================

export const connectDatabase = connectDB;

export default connectDB;

