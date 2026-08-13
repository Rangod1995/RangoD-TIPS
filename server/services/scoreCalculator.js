export function calculateFormScore(matches = []) {
  let points = 0;

  for (const match of matches) {
    const home = match.teams.home.id;
    const winner = match.teams.home.winner;

    const isHome = match.teams.home.id === home;

    if (winner === true) {
      points += 3;
    } else if (winner === null) {
      points += 1;
    }
  }

  return Math.min(25, points * 1.6);
}

export function calculateAttackScore(stats) {
  if (!stats) return 0;

  const goals =
    stats.goals?.for?.total?.total ??
    stats.goals?.for?.total ??
    0;

  return Math.min(15, goals / 2);
}

export function calculateDefenseScore(stats) {
  if (!stats) return 0;

  const conceded =
    stats.goals?.against?.total?.total ??
    stats.goals?.against?.total ??
    0;

  return Math.max(0, 10 - conceded / 5);
}

export function calculateStandingScore(rank) {
  if (!rank) return 15;

  return Math.max(0, 30 - rank);
}