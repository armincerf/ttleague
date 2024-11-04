import type { Match } from "@/lib/actions/matches";

interface MatchCardProps {
	match: Match;
	userId: string;
}

export function MatchCard({ match, userId }: MatchCardProps) {
	return (
		<div className="border rounded-lg p-4 bg-white shadow-sm">
			<div className="flex justify-between items-center mb-2">
				<h3 className="font-semibold">
					{match.status === "ongoing" ? "Current Match" : "Next Match"}
				</h3>
				{match.status === "ongoing" && (
					<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
						Table {match.table_number}
					</span>
				)}
			</div>

			<div className="flex items-center gap-2">
				<div className="flex-1 text-center">
					{match.player_1 === userId ? "You" : match.player_2}
				</div>
				<div className="text-gray-500">vs</div>
				<div className="flex-1 text-center">
					{match.player_2 === userId ? "You" : match.player_1}
				</div>
			</div>
		</div>
	);
}
