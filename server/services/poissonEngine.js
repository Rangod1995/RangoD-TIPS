const factorialCache = [1];

function factorial(n) {
    if (n < 0) return 1;

    if (factorialCache[n] !== undefined) {
        return factorialCache[n];
    }

    let result = factorialCache[factorialCache.length - 1];

    for (let i = factorialCache.length; i <= n; i++) {
        result *= i;
        factorialCache[i] = result;
    }

    return factorialCache[n];
}

function poisson(lambda, goals) {
    if (lambda <= 0) return goals === 0 ? 1 : 0;

    return (
        Math.exp(-lambda) *
        Math.pow(lambda, goals) /
        factorial(goals)
    );
}

function normalize(probabilities) {
    const total = probabilities.reduce((a, b) => a + b, 0);

    return probabilities.map((p) =>
        total === 0 ? 0 : p / total
    );
}

export function generateScoreMatrix(
    expectedHomeGoals,
    expectedAwayGoals,
    maxGoals = 6
) {
    const home = normalize(
        Array.from(
            { length: maxGoals + 1 },
            (_, i) => poisson(expectedHomeGoals, i)
        )
    );

    const away = normalize(
        Array.from(
            { length: maxGoals + 1 },
            (_, i) => poisson(expectedAwayGoals, i)
        )
    );

    const matrix = [];

    for (let h = 0; h <= maxGoals; h++) {
        for (let a = 0; a <= maxGoals; a++) {
            matrix.push({
                homeGoals: h,
                awayGoals: a,
                score: `${h}-${a}`,
                probability: home[h] * away[a],
            });
        }
    }

    matrix.sort(
        (a, b) => b.probability - a.probability
    );

    return matrix;
}

export function summarizeMatrix(matrix) {
    let homeWin = 0;
    let draw = 0;
    let awayWin = 0;

    let bttsYes = 0;

    let over15 = 0;
    let over25 = 0;
    let over35 = 0;

    for (const item of matrix) {
        const total =
            item.homeGoals + item.awayGoals;

        if (item.homeGoals > item.awayGoals)
            homeWin += item.probability;

        if (item.homeGoals === item.awayGoals)
            draw += item.probability;

        if (item.homeGoals < item.awayGoals)
            awayWin += item.probability;

        if (
            item.homeGoals > 0 &&
            item.awayGoals > 0
        ) {
            bttsYes += item.probability;
        }

        if (total >= 2) over15 += item.probability;
        if (total >= 3) over25 += item.probability;
        if (total >= 4) over35 += item.probability;
    }

    return {
        homeWin: Math.round(homeWin * 100),
        draw: Math.round(draw * 100),
        awayWin: Math.round(awayWin * 100),

        bttsYes: Math.round(bttsYes * 100),
        bttsNo: Math.round((1 - bttsYes) * 100),

        over15: Math.round(over15 * 100),
        over25: Math.round(over25 * 100),
        over35: Math.round(over35 * 100),

        under25: Math.round((1 - over25) * 100),

        mostLikelyScore: matrix[0],
        topScorelines: matrix.slice(0, 10),
    };
}