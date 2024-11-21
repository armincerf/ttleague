import { useQuery, useQueryOne } from "@triplit/react";
import { client as triplitClient } from "@/lib/triplit";
import { getWaitingPlayers } from "../utils/playerUtils";
import { createTournamentService } from "../services/tournamentService";
import { useSearchParams } from "next/navigation";
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
	const eventId = params.get("eventId");

	const { result } = useQueryOne(
		triplitClient,
		TOURNAMENT_QUERY.vars({ event_id: eventId ?? "" }),
	);

	const { results: allTournaments } = useQuery(
		triplitClient,
		triplitClient.query("active_tournaments"),
	);
	triplitClient.http
		.fetchOne(
			TOURNAMENT_QUERY.vars({ event_id: eventId ?? "" }).build(),
		)
		.then((res) => {
			console.log("fetch res", res);
		});
	console.log("allTournaments query res", allTournaments);

	console.log("result", result, eventId, params, allTournaments);

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
