// ==========================================
// server/models/Prediction.js
// RangoD AI Engine V7 Enterprise
// Prediction Database Model
// ==========================================

import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
    {
        // ======================================
        // FIXTURE
        // ======================================

        fixtureId: {
            type: Number,
            required: true,
            unique: true,
            index: true
        },

        homeTeam: {
            type: String,
            required: true,
            trim: true
        },

        awayTeam: {
            type: String,
            required: true,
            trim: true
        },

        league: {
            type: String,
            default: "Unknown",
            trim: true
        },

        matchDate: {
            type: Date
        },

        // ======================================
        // PREDICTION
        // ======================================

        prediction: {
            score: {
                home: {
                    type: Number,
                    default: 0,
                    min: 0
                },

                away: {
                    type: Number,
                    default: 0,
                    min: 0
                }
            },

            expectedScore: {
                expectedHome: {
                    type: Number,
                    default: 0
                },

                expectedAway: {
                    type: Number,
                    default: 0
                }
            },

            probabilities: {
                homeWin: {
                    type: Number,
                    default: 0
                },

                draw: {
                    type: Number,
                    default: 0
                },

                awayWin: {
                    type: Number,
                    default: 0
                },

                over15: {
                    type: Number,
                    default: 0
                },

                over25: {
                    type: Number,
                    default: 0
                },

                over35: {
                    type: Number,
                    default: 0
                },

                bttsYes: {
                    type: Number,
                    default: 0
                },

                bttsNo: {
                    type: Number,
                    default: 0
                }
            },

            recommendedMarket: {
                type: mongoose.Schema.Types.Mixed,
                default: null
            },

            alternativeMarkets: {
                type: [mongoose.Schema.Types.Mixed],
                default: []
            }
        },

        // ======================================
        // AI INTELLIGENCE
        // ======================================

        intelligence: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        // ======================================
        // CONFIDENCE
        // ======================================

        confidence: {
            confidence: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            },

            label: {
                type: String,
                default: "Low"
            },

            risk: {
                type: String,
                default: "High"
            },

            breakdown: {
                type: mongoose.Schema.Types.Mixed,
                default: {}
            }
        },

        // ======================================
        // VALIDATION
        // ======================================

        validation: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        // ======================================
        // FEATURES
        // ======================================

        features: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        // ======================================
        // STATUS
        // ======================================

        status: {
            type: String,

            enum: [
                "pending",
                "completed",
                "failed"
            ],

            default: "completed"
        },

        // ======================================
        // PREMIUM SYSTEM
        // ======================================

        isPremium: {
            type: Boolean,
            default: false,
            index: true
        },

        premiumRank: {
            type: Number,
            default: null
        },

        dailyPremiumScore: {
            type: Number,
            default: null
        },

        premiumScore: {
            type: Number,
            default: 0
        },

        premiumCriteria: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },

    {
        timestamps: true,
        strict: true
    }
);

// ==========================================
// INDEXES
// ==========================================

predictionSchema.index({
    matchDate: 1
});

predictionSchema.index({
    matchDate: 1,
    isPremium: 1
});

predictionSchema.index({
    matchDate: 1,
    premiumRank: 1
});

predictionSchema.index({
    matchDate: 1,
    dailyPremiumScore: -1
});

// ==========================================
// MODEL
// ==========================================

export default mongoose.model(
    "Prediction",
    predictionSchema
);