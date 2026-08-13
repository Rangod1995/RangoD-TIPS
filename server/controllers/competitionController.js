import Prediction from "../models/Prediction.js";

const leagueData = {
  "Premier League": {
    country: "England",
    logo: "https://media.api-sports.io/football/leagues/39.png",
  },
  "La Liga": {
    country: "Spain",
    logo: "https://media.api-sports.io/football/leagues/140.png",
  },
  "Serie A": {
    country: "Italy",
    logo: "https://media.api-sports.io/football/leagues/135.png",
  },
  Bundesliga: {
    country: "Germany",
    logo: "https://media.api-sports.io/football/leagues/78.png",
  },
  "Ligue 1": {
    country: "France",
    logo: "https://media.api-sports.io/football/leagues/61.png",
  },
  "UEFA Champions League": {
    country: "Europe",
    logo: "https://media.api-sports.io/football/leagues/2.png",
  },
  "Europa League": {
    country: "Europe",
    logo: "https://media.api-sports.io/football/leagues/3.png",
  },
  "Europa Conference League": {
    country: "Europe",
    logo: "https://media.api-sports.io/football/leagues/848.png",
  },
  "FA Cup": {
    country: "England",
    logo: "https://media.api-sports.io/football/leagues/45.png",
  },
  "EFL Cup": {
    country: "England",
    logo: "https://media.api-sports.io/football/leagues/48.png",
  },
  "Copa del Rey": {
    country: "Spain",
    logo: "https://media.api-sports.io/football/leagues/143.png",
  },
  "DFB Pokal": {
    country: "Germany",
    logo: "https://media.api-sports.io/football/leagues/81.png",
  },
  "Coppa Italia": {
    country: "Italy",
    logo: "https://media.api-sports.io/football/leagues/137.png",
  },
};

const DEFAULT_LOGO =
  "https://cdn-icons-png.flaticon.com/512/53/53283.png";

export const getCompetitions = async (req, res) => {
  try {
    const competitions = await Prediction.aggregate([
      {
        $match: {
          league: {
            $exists: true,
            $ne: "",
          },
        },
      },
      {
        $group: {
          _id: "$league",
          predictions: {
            $sum: 1,
          },
          matchesToday: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$matchDate",
                      },
                    },
                    {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$$NOW",
                      },
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const result = competitions.map((competition) => {
      const meta = leagueData[competition._id] || {};

      return {
        id: competition._id
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, ""),

        name: competition._id,
        country: meta.country || "International",
        logo: meta.logo || DEFAULT_LOGO,
        matchesToday: competition.matchesToday,
        predictions: competition.predictions,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Competition Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch competitions.",
    });
  }
};