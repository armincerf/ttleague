import type { Match, User } from "@/triplit/schema";

export function getWaitingPlayers(players: User[], matches: Match[]) {
	return players.filter(
		(player) =>
			!matches.some(
				(match) =>
					match.status !== "ended" &&
					(match.player_1 === player.id ||
						match.player_2 === player.id ||
						match.umpire === player.id),
			),
	);
}
