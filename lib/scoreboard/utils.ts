import type { ScoreboardContext } from "./machine";
import type { Player } from "./types";

export function getWinner(context: ScoreboardContext): boolean | null {
	const { player1Score, player2Score, pointsToWin } = context;
	const twoPointLead = Math.abs(player1Score - player2Score) >= 2;
	const reachedMinPoints = Math.max(player1Score, player2Score) >= pointsToWin;

	if (reachedMinPoints && twoPointLead) {
		return player1Score > player2Score;
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

export function calculateCurrentServer(context: ScoreboardContext): string {
	const {
		player1Score,
		player2Score,
		pointsToWin,
		playerOneStarts,
		player1Name,
		player2Name,
		player1GamesWon,
		player2GamesWon,
	} = context;

	const totalScore = player1Score + player2Score;
	const totalGames = player1GamesWon + player2GamesWon;
	const isOddGame = totalGames % 2 === 1;
	const effectivePlayerOneStarts = isOddGame
		? !playerOneStarts
		: playerOneStarts;

	function getCurrentServer(isPlayerOneServing: boolean) {
		return isPlayerOneServing ? player1Name : player2Name;
	}

	// Handle deuce scenario
	if (shouldAlternateEveryPoint(player1Score, player2Score, pointsToWin)) {
		return getCurrentServer(
			(totalScore % 2 === 0) === effectivePlayerOneStarts,
		);
	}

	// Determine points per serve based on pointsToWin
	const pointsPerServe = pointsToWin <= 11 ? 2 : 5;
	const serviceBlock = Math.floor(totalScore / pointsPerServe);

	return getCurrentServer(
		(serviceBlock % 2 === 0) === effectivePlayerOneStarts,
	);
}
