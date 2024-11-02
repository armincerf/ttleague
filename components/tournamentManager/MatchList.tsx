import { Table } from "lucide-react";
import type { Match } from "@/lib/tournamentManager/types";
import { MatchCard } from "./MatchCard";

interface MatchListProps {
	matches: Match[];
	tables: number;
	freeTables: number;
	onConfirmWinner: (matchId: string, winnerId: string) => void;
	onConfirmMatch: (matchId: string, playerId: string) => void;
}

export function MatchList({
	matches,
	tables,
	freeTables,
	onConfirmWinner,
	onConfirmMatch,
}: MatchListProps) {
	const activeMatches = matches.filter((match) => match.state === "ongoing");

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
					{activeMatches.map((match, index) => (
						<MatchCard
							key={match.id}
							match={match}
							tableNumber={index + 1}
							onConfirmWinner={onConfirmWinner}
							onConfirmMatch={onConfirmMatch}
						/>
					))}
				</ul>
			)}
		</div>
	);
}
