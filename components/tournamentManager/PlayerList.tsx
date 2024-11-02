import { Users } from "lucide-react";
import type { Player } from "@/lib/tournamentManager/types";

interface PlayerListProps {
	players: Player[];
	maxPlayerCount: number;
}

export function PlayerList({ players, maxPlayerCount }: PlayerListProps) {
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
					{players.map((player) => (
						<li
							key={player.id}
							className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
						>
							<span className="font-medium">{player.name}</span>
							<span
								className={`px-2 py-1 rounded text-sm ${
									player.state === "playing"
										? "bg-green-100 text-green-800"
										: player.state === "umpiring"
											? "bg-blue-100 text-blue-800"
											: "bg-gray-100 text-gray-800"
								}`}
							>
								{player.state.charAt(0).toUpperCase() + player.state.slice(1)}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
