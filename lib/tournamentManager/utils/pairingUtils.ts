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

export function findValidPlayerPair(
	players: User[],
	matches: Match[],
	totalRounds = 1,
) {
	// Sort players by number of matches played
	const playerPairs = players.flatMap((p1, i) =>
		players.slice(i + 1).map((p2) => [p1, p2] as const),
	);

	// Count matches between each pair
	const pairMatchCounts = new Map<string, number>();
	for (const match of matches) {
		const pairKey = [match.player_1, match.player_2].sort().join("-");
		pairMatchCounts.set(pairKey, (pairMatchCounts.get(pairKey) ?? 0) + 1);
	}

	// Sort pairs by number of matches played together
	return playerPairs
		.sort((a, b) => {
			const pairKeyA = [a[0].id, a[1].id].sort().join("-");
			const pairKeyB = [b[0].id, b[1].id].sort().join("-");
			const matchesA = pairMatchCounts.get(pairKeyA) ?? 0;
			const matchesB = pairMatchCounts.get(pairKeyB) ?? 0;
			return matchesA - matchesB;
		})
		.find(([p1, p2]) => {
			const pairKey = [p1.id, p2.id].sort().join("-");
			const matchCount = pairMatchCounts.get(pairKey) ?? 0;
			return matchCount < totalRounds;
		});
}
