import { Users } from "lucide-react";
import type { User } from "@/triplit/schema";
import type { Match } from "@/triplit/schema";
import {
	getPlayerStatus,
	isPlayerInMatch,
	type PlayerStatus,
} from "@/lib/tournamentManager/utils/matchStateUtils";

interface PlayerListProps {
	players: User[];
	maxPlayerCount: number;
	matches: Match[];
}

const statusStyles: Record<PlayerStatus, string> = {
	umpiring: "bg-blue-100 text-blue-800",
	playing: "bg-green-100 text-green-800",
	confirmed: "bg-emerald-100 text-emerald-800",
	pending: "bg-yellow-100 text-yellow-800",
	waiting: "bg-gray-100 text-gray-800",
};

export function PlayerList({
	players,
	maxPlayerCount,
	matches,
}: PlayerListProps) {
	return (
		<div className="bg-white p-6 rounded-lg shadow">
			<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
				<Users className="w-6 h-6" />
				Players ({players.length}/{maxPlayerCount})
			</h2>

			{players.length === 0 ? (
				<p className="text-gray-500">No players have joined yet.</p>
			) : (
				<ul className="space-y-2">
					{players.map((player) => {
						const match = matches.find((m) => isPlayerInMatch(player.id, m));
						const { status } = getPlayerStatus(player, match);

						return (
							<li
								key={player.id}
								className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
							>
								<span className="font-medium">
									{player.first_name} {player.last_name}
								</span>
								<span
									className={`px-2 py-1 rounded text-sm ${statusStyles[status]}`}
								>
									{status.charAt(0).toUpperCase() + status.slice(1)}
								</span>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
