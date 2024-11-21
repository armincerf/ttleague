import { useQuery, useQueryOne } from "@triplit/react";
import { client as triplitClient } from "@/lib/triplit";
import { getWaitingPlayers } from "../utils/playerUtils";
import { createTournamentService } from "../services/tournamentService";
import { useParams, useSearchParams } from "next/navigation";
import type { Match, User } from "@/triplit/schema";

const TOURNAMENT_QUERY = triplitClient
	.query("active_tournaments")
	.where([["event_id", "=", "$event_id"]])
	.include("event")
	.include("players")
	.include("matches");
export const tournamentService = createTournamentService(triplitClient);

export function useTournament() {
	const params = useSearchParams();
	const pathParams = useParams();
	const eventId = params.get("eventId") ?? pathParams.eventId;

	const { result } = useQueryOne(
		triplitClient,
		TOURNAMENT_QUERY.vars({ event_id: eventId ?? "" }),
	);
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
