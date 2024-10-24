import type { Game } from "@/triplit/schema";

export function getGameNumber(games: Game[]) {
	return games?.length ? games.length : 0;
}
