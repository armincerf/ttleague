import { Table } from "lucide-react";
import { MatchCard } from "./MatchCard";
import type { Match, User } from "@/triplit/schema";
interface MatchListProps {
	matches: Match[];
	players: User[];
	tables: number;
	freeTables: number;
}

export function MatchList({
	matches,
	players,
	tables,
	freeTables,
}: MatchListProps) {
	const activeMatches = matches.filter(
		(match) => match.status === "ongoing" || match.status === "pending",
	);

	return (
		<div className="bg-white p-6 rounded-lg shadow">
			<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
				<Table className="w-6 h-6" />
				Active Matches ({tables - freeTables}/{tables} tables in use)
			</h2>

			{activeMatches.length === 0 ? (
				<p className="text-gray-500">No active matches.</p>
			) : (
				<ul className="space-y-4">
					{activeMatches.map((match, index) => {
						const player1 = players.find((p) => p.id === match.player_1);
						const player2 = players.find((p) => p.id === match.player_2);
						const umpire = players.find((p) => p.id === match.umpire);
						if (!player1 || !player2 || !umpire) return null;

						return (
							<MatchCard
								key={match.id}
								match={match}
								player1={player1}
								player2={player2}
								umpire={umpire}
								tableNumber={index + 1}
							/>
						);
					})}
				</ul>
			)}
		</div>
	);
}
