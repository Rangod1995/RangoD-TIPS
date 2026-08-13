import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ==========================================
// RangoD TIPS V7 Enterprise
// Environment Configuration
// ==========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server/config -> server
const serverDirectory = path.resolve(__dirname, "..");

// Explicitly load server/.env
dotenv.config({
    path: path.join(serverDirectory, ".env")
});

// ==========================================
// Environment Values
// ==========================================

export const config = {
    port:
        process.env.PORT || 5000,

    mongoUri:
        process.env.MONGO_URI,

    jwtSecret:
        process.env.JWT_SECRET,

    footballApiKey:
        process.env.FOOTBALL_API_KEY,

    footballApiUrl:
        process.env.FOOTBALL_API_URL ||
        "https://v3.football.api-sports.io",

    paystackSecret:
        process.env.PAYSTACK_SECRET_KEY,

    nodeEnv:
        process.env.NODE_ENV ||
        "development"
};

// ==========================================
// Environment Validation
// ==========================================

const required = [
    "MONGO_URI",
    "FOOTBALL_API_KEY"
];

required.forEach((key) => {
    if (!process.env[key]) {
        console.warn(
            `⚠️ Missing environment variable: ${key}`
        );
    }
});
