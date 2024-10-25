import type { Match } from "@/lib/actions/matches";

export function padScore(score: string | null): string {
	if (!score) return "\u00A0\u00A0\u00A0-\u00A0\u00A0\u00A0";
	const [score1, score2] = score.split("-").map((s) => s.trim());
	return `${score1.padStart(2, "\u00A0")} - ${score2.padStart(2, "\u00A0")}`;
}

export function getGameNumber(games: Match["games"]) {
	return games?.length ? games.length : 0;
}

export function calculateCurrentScore(games: Match["games"]): [number, number] {
	return games
		.filter((game) => game.completed_at)
		.reduce(
			(totals, game) => [
				totals[0] + (game.player_1_score > game.player_2_score ? 1 : 0),
				totals[1] + (game.player_2_score > game.player_1_score ? 1 : 0),
			],
			[0, 0],
		);
}

export function formatScore(score: [number, number]): string {
	return padScore(score.join("-"));
}
