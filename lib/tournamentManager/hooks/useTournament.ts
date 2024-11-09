import { useQueryOne } from "@triplit/react";
import { client as triplitClient } from "@/lib/triplit";
import { getWaitingPlayers } from "../utils/playerUtils";
import { createTournamentService } from "../services/tournamentService";
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";

const TOURNAMENT_QUERY = triplitClient
	.query("active_tournaments")
	.include("players")
	.include("event")
	.include("matches")
	.build();

export const tournamentService = createTournamentService(triplitClient);

export function useTournament() {
	const eventId = useParams().eventId;
	const queryClient = useQueryClient();
	useEffect(() => {
		const subscription = triplitClient.subscribe(TOURNAMENT_QUERY, (data) => {
			queryClient.setQueryData(["tournament", eventId], data[0]);
		});
		return () => subscription();
	}, [eventId, queryClient.setQueryData]);

	const { data: result } = useQuery({
		queryKey: ["tournament", eventId],
		queryFn: () => triplitClient.fetchOne(TOURNAMENT_QUERY),
		refetchInterval: 10000, // 10 seconds
		enabled: !!eventId,
	});

	const state = useMemo(
		() =>
			result
				? {
						...result,
						waitingPlayers: getWaitingPlayers(
							result.players ?? [],
							result.matches ?? [],
						),
					}
				: null,
		[result],
	);

	return {
		state,
		service: tournamentService,
	};
}

export type TournamentState = NonNullable<
	ReturnType<typeof useTournament>["state"]
>;
