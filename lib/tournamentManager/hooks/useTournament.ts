import { useQueryOne } from "@triplit/react";
import { client as triplitClient } from "@/lib/triplit";
import { getWaitingPlayers } from "../utils/playerUtils";
import { createTournamentService } from "../services/tournamentService";
export const tournamentService = createTournamentService(triplitClient);
export function useTournament() {
	const result = useQueryOne(
		triplitClient,
		triplitClient
			.query("active_tournaments")
			.include("players")
			.include("event")
			.include("matches"),
	).result;

	const state = result
		? {
				...result,
				waitingPlayers: getWaitingPlayers(
					result.players ?? [],
					result.matches ?? [],
				),
			}
		: null;

	return {
		state,
		service: tournamentService,
	};
}
export type TournamentState = NonNullable<
	ReturnType<typeof useTournament>["state"]
>;
