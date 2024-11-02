import type { Match } from "@/triplit/schema";
import type { User } from "@/triplit/schema";

export function getMatchState(match: Match) {
	const hasAllPlayersConfirmed = match.playersConfirmed.size === 2;

	return {
		isPending: match.status === "pending",
		needsPlayersInitialConfirmation:
			match.status === "pending" && !hasAllPlayersConfirmed,
		needsUmpireInitialConfirmation:
			match.status === "pending" &&
			hasAllPlayersConfirmed &&
			!match.umpireConfirmed,
		needsWinnerSelection: match.status === "ongoing" && !match.winner,
		needsUmpireConfirmation:
			match.status === "ongoing" && match.winner && !match.umpireConfirmed,
	};
}

export function isPlayerInMatch(playerId: string, match: Match) {
	return (
		match.player_1 === playerId ||
		match.player_2 === playerId ||
		match.umpire === playerId
	);
}

export function getPlayerStatus(player: User, match: Match | undefined) {
	if (!match) return { status: "waiting" as const };

	const isPending = match.status === "pending";
	const isUmpiring = match.umpire === player.id;
	const isConfirmed =
		isPending &&
		((isUmpiring && match.umpireConfirmed) ||
			match.playersConfirmed.has(player.id));

	return {
		status: isUmpiring
			? ("umpiring" as const)
			: match.status === "ongoing"
				? ("playing" as const)
				: isConfirmed
					? ("confirmed" as const)
					: isPending
						? ("pending" as const)
						: ("waiting" as const),
	};
}

export type PlayerStatus = ReturnType<typeof getPlayerStatus>["status"];
