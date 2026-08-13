const LEAGUE_PROFILES = {
    // England
    39: {
        name: "Premier League",
        goalFactor: 1.08,
        drawFactor: 0.92,
        bttsFactor: 1.10,
        homeAdvantage: 1.05,
        reliability: 0.98,
    },

    // Spain
    140: {
        name: "La Liga",
        goalFactor: 0.96,
        drawFactor: 1.05,
        bttsFactor: 0.95,
        homeAdvantage: 1.08,
        reliability: 0.97,
    },

    // Italy
    135: {
        name: "Serie A",
        goalFactor: 1.02,
        drawFactor: 1.03,
        bttsFactor: 1.00,
        homeAdvantage: 1.06,
        reliability: 0.98,
    },

    // Germany
    78: {
        name: "Bundesliga",
        goalFactor: 1.18,
        drawFactor: 0.88,
        bttsFactor: 1.15,
        homeAdvantage: 1.02,
        reliability: 0.97,
    },

    // France
    61: {
        name: "Ligue 1",
        goalFactor: 0.94,
        drawFactor: 1.08,
        bttsFactor: 0.92,
        homeAdvantage: 1.04,
        reliability: 0.96,
    },

    // Netherlands
    88: {
        name: "Eredivisie",
        goalFactor: 1.22,
        drawFactor: 0.90,
        bttsFactor: 1.18,
        homeAdvantage: 1.01,
        reliability: 0.96,
    },

    // Portugal
    94: {
        name: "Primeira Liga",
        goalFactor: 0.98,
        drawFactor: 1.02,
        bttsFactor: 0.96,
        homeAdvantage: 1.07,
        reliability: 0.96,
    },

    // Belgium
    144: {
        name: "Jupiler Pro League",
        goalFactor: 1.12,
        drawFactor: 0.94,
        bttsFactor: 1.10,
        homeAdvantage: 1.03,
        reliability: 0.95,
    },

    // Turkey
    203: {
        name: "Super Lig",
        goalFactor: 1.10,
        drawFactor: 0.95,
        bttsFactor: 1.08,
        homeAdvantage: 1.06,
        reliability: 0.95,
    },

    default: {
        name: "Default",
        goalFactor: 1.00,
        drawFactor: 1.00,
        bttsFactor: 1.00,
        homeAdvantage: 1.00,
        reliability: 0.90,
    },
};

export function getLeagueProfile(leagueId) {
    return (
        LEAGUE_PROFILES[leagueId] ??
        LEAGUE_PROFILES.default
    );
}