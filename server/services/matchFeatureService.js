import { getStandings } from "./standingsService.js";
import { getTeamForm } from "./formService.js";
import { getTeamStatistics } from "./statisticsService.js";
import { getHeadToHead } from "./headToHeadService.js";

export async function buildMatchFeatures(match) {
  const home = match.teams.home;
  const away = match.teams.away;

  const leagueId = match.league.id;
  const season = match.league.season;

  const [
    standings,
    homeForm,
    awayForm,
    homeStats,
    awayStats,
    headToHead,
  ] = await Promise.all([
    getStandings(leagueId, season),
    getTeamForm(home.id),
    getTeamForm(away.id),
    getTeamStatistics(leagueId, home.id, season),
    getTeamStatistics(leagueId, away.id, season),
    getHeadToHead(home.id, away.id),
  ]);

  return {
    match,
    home,
    away,
    leagueId,
    season,
    standings,
    homeStanding: standings?.find(t => t.team.id === home.id),
    awayStanding: standings?.find(t => t.team.id === away.id),
    homeForm,
    awayForm,
    homeStats,
    awayStats,
    headToHead,
  };
}