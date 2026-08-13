// ==========================================
// server/controllers/matchController.js
// RangoD TIPS V7 Enterprise
// Match Controller
// ==========================================

import Prediction from "../models/Prediction.js";

import {
    getTodayMatches,
    getFixtures,
    getLiveMatches as getLiveMatchesService,
} from "../services/footballService.js";


// ==========================================
// HELPERS
// ==========================================

function getTodayDate() {
    return new Date()
        .toISOString()
        .split("T")[0];
}


// ==========================================
// TODAY'S MATCHES
// ==========================================

export async function getMatches(req, res) {

    const { date } = req.query;

    const requestedDate =
        date || getTodayDate();

    try {

        const matches = date
            ? await getFixtures(date)
            : await getTodayMatches();

        if (
            Array.isArray(matches) &&
            matches.length > 0
        ) {

            return res.status(200).json({

                success: true,

                source: "api-football",

                date: requestedDate,

                count: matches.length,

                matches:
                    matches.slice(0, 50),

            });

        }

        throw new Error(
            "No fixtures returned from API."
        );

    } catch (error) {

        console.warn(
            "[MatchController] API unavailable. Using MongoDB fallback:",
            error?.message
        );

        // ======================================
        // MONGODB FALLBACK
        // ======================================

        try {

            const start =
                new Date();

            start.setHours(
                0,
                0,
                0,
                0
            );

            const end =
                new Date(start);

            end.setDate(
                end.getDate() + 1
            );

            let predictions =
                await Prediction.find({

                    matchDate: {
                        $gte: start,
                        $lt: end,
                    },

                })
                    .sort({
                        matchDate: 1,
                    })
                    .limit(50)
                    .lean();


            // ==================================
            // FALLBACK TO MOST RECENT
            // ==================================

            if (
                predictions.length === 0
            ) {

                predictions =
                    await Prediction.find({})
                        .sort({
                            matchDate: -1,
                        })
                        .limit(50)
                        .lean();

            }


            // ==================================
            // NORMALIZE STORED PREDICTIONS
            // ==================================

            const matches =
                predictions.map(
                    (prediction) => ({

                        fixture: {

                            id:
                                prediction.fixtureId ||
                                prediction._id,

                            fixtureId:
                                prediction.fixtureId,

                            date:
                                prediction.matchDate,

                            venue: {
                                name:
                                    "Stored Prediction",
                            },

                            status: {
                                short: "NS",
                            },

                        },

                        league: {

                            name:
                                prediction.league ||
                                "Unknown League",

                        },

                        teams: {

                            home: {

                                name:
                                    prediction.homeTeam ||
                                    "Home Team",

                            },

                            away: {

                                name:
                                    prediction.awayTeam ||
                                    "Away Team",

                            },

                        },

                        goals: {

                            home: null,

                            away: null,

                        },

                        aiPrediction: {

                            prediction:
                                prediction.prediction,

                            confidence:
                                prediction.confidence,

                        },

                    })
                );


            return res.status(200).json({

                success: true,

                source: "mongodb",

                date: requestedDate,

                count: matches.length,

                matches,

            });

        } catch (dbError) {

            console.error(
                "[MatchController] MongoDB fallback failed:",
                dbError
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load matches.",

            });

        }

    }

}


// ==========================================
// LIVE MATCHES
// ==========================================

export async function getLiveMatches(
    req,
    res
) {

    try {

        console.log(
            "[MatchController] Requesting live matches..."
        );


        const matches =
            await getLiveMatchesService();


        // ======================================
        // ALWAYS RETURN AN ARRAY
        // ======================================

        const normalizedMatches =
            Array.isArray(matches)
                ? matches
                : [];


        console.log(
            `[MatchController] Live matches received: ${normalizedMatches.length}`
        );


        // ======================================
        // SUCCESS
        // ======================================

        return res.status(200).json({

            success: true,

            source: "api-football",

            count:
                normalizedMatches.length,

            matches:
                normalizedMatches,

            timestamp:
                new Date().toISOString(),

        });

    } catch (error) {

        console.error(
            "[MatchController] Live matches error:",
            error
        );


        // ======================================
        // IMPORTANT:
        // Return an empty successful response
        // instead of crashing the frontend.
        //
        // This allows LiveMatches.jsx to remain
        // functional when API-Football temporarily
        // fails.
        // ======================================

        return res.status(200).json({

            success: true,

            source: "api-fallback",

            count: 0,

            matches: [],

            temporaryUnavailable: true,

            message:
                "Live football data is temporarily unavailable.",

            timestamp:
                new Date().toISOString(),

        });

    }

}


// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    getMatches,
    getLiveMatches,
};