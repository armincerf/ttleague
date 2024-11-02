import type { Match, User } from "@/triplit/schema";

type ScoreboardProps = {
	players: User[];
	matches: Match[];
};

function calculatePlayerStats(playerId: string, matches: Match[]) {
	return matches.reduce(
		(stats, match) => {
			if (match.status !== "ended") return stats;

			return {
				wins: stats.wins + (match.winner === playerId ? 1 : 0),
				losses:
					stats.losses +
					((match.player_1 === playerId || match.player_2 === playerId) &&
					match.winner !== playerId
						? 1
						: 0),
				umpired: stats.umpired + (match.umpire === playerId ? 1 : 0),
			};
		},
		{ wins: 0, losses: 0, umpired: 0 },
	);
}

export function Scoreboard({ players, matches }: ScoreboardProps) {
	const playerStats = players.map((player) => ({
		...player,
		...calculatePlayerStats(player.id, matches),
	}));

	// Sort by wins descending, then losses ascending
	const sortedStats = playerStats.sort(
		(a, b) => b.wins - a.wins || a.losses - b.losses,
	);

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full table-auto">
				<thead>
					<tr className="bg-gray-100">
						<th className="px-4 py-2 text-left">Player</th>
						<th className="px-4 py-2 text-center">Wins</th>
						<th className="px-4 py-2 text-center">Losses</th>
						<th className="px-4 py-2 text-center">Umpired</th>
					</tr>
				</thead>
				<tbody>
					{sortedStats.map((player) => (
						<tr key={player.id} className="border-t">
							<td className="px-4 py-2">
								{player.first_name} {player.last_name}
							</td>
							<td className="px-4 py-2 text-center">{player.wins}</td>
							<td className="px-4 py-2 text-center">{player.losses}</td>
							<td className="px-4 py-2 text-center">{player.umpired}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
