import type { TournamentMatch } from "@/lib/tournamentManager/hooks/usePlayerTournament";

export default function MatchStatistics({ match }: { match: TournamentMatch }) {
	return (
		<div className="relative mt-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
			<div className="absolute -top-2 -right-2">
				<span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 border border-yellow-200">
					In Development
				</span>
			</div>

			<h3 className="text-sm font-medium text-gray-900 mb-3">
				Match Statistics
			</h3>

			<div className="grid grid-cols-2 gap-4 text-sm">
				<div>
					<div className="text-gray-500">Points Won on Serve</div>
					<div className="font-medium">—</div>
				</div>
				<div>
					<div className="text-gray-500">Longest Rally</div>
					<div className="font-medium">—</div>
				</div>
				<div>
					<div className="text-gray-500">Points Won %</div>
					<div className="font-medium">—</div>
				</div>
				<div>
					<div className="text-gray-500">Average Rally Length</div>
					<div className="font-medium">—</div>
				</div>
			</div>
		</div>
	);
}
