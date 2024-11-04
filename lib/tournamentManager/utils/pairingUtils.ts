import type { Match, User } from "@/triplit/schema";

export function getAllPossiblePairings<T extends { id: string }>(players: T[]) {
	const pairs: Array<[T, T]> = [];

	for (let i = 0; i < players.length; i++) {
		for (let j = i + 1; j < players.length; j++) {
			pairs.push([players[i], players[j]]);
		}
	}

	return pairs;
}

export function hasPlayedMatch(
	player1Id: string,
	player2Id: string,
	matches: Match[],
	totalRounds: number,
): boolean {
	const matchCount = matches.filter(
		(match) =>
			(match.player_1 === player1Id && match.player_2 === player2Id) ||
			(match.player_1 === player2Id && match.player_2 === player1Id),
	).length;

	return matchCount >= totalRounds;
}

export function createPairKey(id1: string, id2: string) {
	return [id1, id2].sort().join("-");
}

export function getPlayerPairScore(
	[p1, p2]: readonly [User, User],
	pairMatchCounts: Map<string, number>,
	playerMatchCounts: Map<string, number>,
) {
	const pairKey = createPairKey(p1.id, p2.id);
	const pairMatches = pairMatchCounts.get(pairKey) ?? 0;
	const totalMatches =
		(playerMatchCounts.get(p1.id) ?? 0) + (playerMatchCounts.get(p2.id) ?? 0);
	const priorityScore =
		(p1.current_tournament_priority ?? 0) +
		(p2.current_tournament_priority ?? 0);

	// Weights: total matches (10) > pair matches (5) > priority (2)
	return totalMatches * 10 + pairMatches * 5 - priorityScore * 2;
}
export function findValidPlayerPair(
	players: User[],
	matches: Match[],
	totalRounds = 1,
) {
	// Count matches between each pair and individual matches
	const pairMatchCounts = new Map<string, number>();
	const playerMatchCounts = new Map<string, number>();

	for (const match of matches) {
		const pairKey = createPairKey(match.player_1, match.player_2);
		pairMatchCounts.set(pairKey, (pairMatchCounts.get(pairKey) ?? 0) + 1);

		playerMatchCounts.set(
			match.player_1,
			(playerMatchCounts.get(match.player_1) ?? 0) + 1,
		);
		playerMatchCounts.set(
			match.player_2,
			(playerMatchCounts.get(match.player_2) ?? 0) + 1,
		);
	}

	const playerPairs = players.flatMap((p1, i) =>
		players.slice(i + 1).map((p2) => [p1, p2] as const),
	);

	return playerPairs
		.sort(
			(a, b) =>
				getPlayerPairScore(a, pairMatchCounts, playerMatchCounts) -
				getPlayerPairScore(b, pairMatchCounts, playerMatchCounts),
		)
		.find(([p1, p2]) => {
			const pairKey = createPairKey(p1.id, p2.id);
			return (pairMatchCounts.get(pairKey) ?? 0) < totalRounds;
		});
}
