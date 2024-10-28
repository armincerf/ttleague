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

export function splitName(fullName: string) {
	const parts = fullName.trim().split(/\s+/);
	if (parts.length === 0 || (parts.length === 1 && !parts[0])) {
		return { firstName: "", lastName: "" };
	}
	const firstName = parts[0];
	const lastName = parts.slice(1).join(" ");
	return { firstName, lastName: lastName || "" };
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
