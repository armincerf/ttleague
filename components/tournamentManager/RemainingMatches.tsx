import type { Match, User } from "@/triplit/schema";
import {
	getAllPossiblePairings,
	hasPlayedMatch,
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
	const allPairings = getAllPossiblePairings(players);
	const remainingPairings = allPairings
		.map(([p1, p2]) => {
			const playedMatches = matches.filter(
				(match) =>
					(match.player_1 === p1.id && match.player_2 === p2.id) ||
					(match.player_1 === p2.id && match.player_2 === p1.id),
			).length;
			const remainingMatches = totalRounds - playedMatches;
			return { p1, p2, remainingMatches };
		})
		.filter(({ remainingMatches }) => remainingMatches > 0);

	return (
		<div className="space-y-2">
			<h3 className="font-semibold text-lg">
				Remaining Matches ({remainingPairings.length})
			</h3>
			<ul className="space-y-1">
				{remainingPairings.map(({ p1, p2, remainingMatches }) => (
					<li key={`${p1.id}-${p2.id}`} className="text-sm">
						{p1.first_name} {p1.last_name} vs {p2.first_name} {p2.last_name}
						{remainingMatches > 1 && ` × ${remainingMatches}`}
					</li>
				))}
			</ul>
		</div>
	);
}
