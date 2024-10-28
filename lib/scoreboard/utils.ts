import type { ScoreboardContext } from "./machine";
import type { Player } from "./types";

export function getWinner(context: ScoreboardContext): 1 | 2 | null {
	const { player1Score, player2Score, pointsToWin } = context;
	const twoPointLead = Math.abs(player1Score - player2Score) >= 2;
	const reachedMinPoints = Math.max(player1Score, player2Score) >= pointsToWin;

	if (reachedMinPoints && twoPointLead) {
		return player1Score > player2Score ? 1 : 2;
	}
	return null;
}

export function splitName(fullName: string): Player {
	const parts = fullName.trim().split(/\s+/);
	if (parts.length === 1) {
		return { firstName: parts[0], lastName: "" };
	}
	return {
		firstName: parts.slice(0, -1).join(" "),
		lastName: parts[parts.length - 1],
	};
}

export function formatPlayerName(player: Player): string {
	return `${player.firstName}${player.lastName ? ` ${player.lastName[0]}` : ""}`;
}

export function shouldAlternateEveryPoint(
	player1Score: number,
	player2Score: number,
	pointsToWin: number,
): boolean {
	return player1Score >= pointsToWin - 1 && player2Score >= pointsToWin - 1;
}
