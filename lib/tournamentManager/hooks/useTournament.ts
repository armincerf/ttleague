import { useQueryOne } from "@triplit/react";
import { client as triplitClient } from "@/lib/triplit";
import { getWaitingPlayers } from "../utils/playerUtils";
import { createTournamentService } from "../services/tournamentService";
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import type { Match, User } from "@/triplit/schema";

const TOURNAMENT_QUERY = triplitClient
	.query("active_tournaments")
	.where([["event_id", "=", "$event_id"]])
	.include("event")
	.include("players")
	.include("matches");
export const tournamentService = createTournamentService(triplitClient);

export function useTournament() {
	const eventId = useParams().eventId;

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
