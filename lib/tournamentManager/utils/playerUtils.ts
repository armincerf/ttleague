import type { Match, User } from "@/triplit/schema";

/**
 * Gets the list of players who are currently waiting (not playing or umpiring)
 * @param players - Array of all players in the tournament
 * @param matches - Array of all matches in the tournament
 * @returns Array of players who are not currently involved in any ongoing/pending matches
 */
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
