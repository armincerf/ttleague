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
	.include("event")
	.include("players")
	.include("matches")
	.build();
export const tournamentService = createTournamentService(triplitClient);

export function useTournament() {
	const eventId = useParams().eventId;

	const { data: result } = useQuery({
		queryKey: ["tournament", eventId],
		queryFn: () => triplitClient.http.fetchOne(TOURNAMENT_QUERY),
		refetchInterval: 1000, // 10 seconds
		enabled: !!eventId,
	});

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
