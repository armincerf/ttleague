import type { Match, User } from "@/triplit/schema";
import {
	getAllPossiblePairings,
	findValidPlayerPair,
	createPairKey,
	getPlayerPairScore,
} from "@/lib/tournamentManager/utils/pairingUtils";

type RemainingMatchesProps = {
	players: User[];
	matches: Match[];
	totalRounds: number;
};

export function RemainingMatches({
	players,
	matches,
	totalRounds,
}: RemainingMatchesProps) {
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

	const allPairings = getAllPossiblePairings(players)
		.map((pair) => ({
			p1: pair[0],
			p2: pair[1],
			remainingMatches:
				totalRounds -
				(pairMatchCounts.get(createPairKey(pair[0].id, pair[1].id)) ?? 0),
			score: getPlayerPairScore(pair, pairMatchCounts, playerMatchCounts),
		}))
		.filter(({ remainingMatches }) => remainingMatches > 0)
		.sort((a, b) => a.score - b.score);

	return (
		<div className="space-y-2">
			<h3 className="font-semibold text-lg">
				Probable Match Schedule ({allPairings.length})
			</h3>
			<ul className="space-y-1">
				{allPairings.map(({ p1, p2, remainingMatches, score }) => (
					<li key={createPairKey(p1.id, p2.id)} className="text-sm">
						{p1.first_name} {p1.last_name} vs {p2.first_name} {p2.last_name}
						{remainingMatches > 1 && ` × ${remainingMatches}`}
						<span className="text-gray-500 text-xs ml-2">
							(priority: {score * -1})
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}
