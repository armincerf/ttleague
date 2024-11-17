"use client";
import { useQuery } from "@triplit/react";
import { client } from "@/lib/triplit";
import { tournamentService, useTournament } from "./useTournament";

export function usePlayerTournament(playerId: string) {
	const { state: tournamentState, service } = useTournament();
	const { results: registeredPlayers = [] } = useQuery(
		client,
		client
			.query("event_registrations")
			.where("event_id", "=", tournamentState?.event_id ?? ""),
	);

	const matches = tournamentState?.matches;
	const activeMatches = matches?.filter(
		(m) => m.status === "ongoing" || m.status === "pending",
	);
	function isMatchForPlayer(match: {
		player_1: string;
		player_2: string;
		umpire: string | undefined;
	}) {
		return (
			match.player_1 === playerId ||
			match.player_2 === playerId ||
			match.umpire === playerId
		);
	}

	const currentMatch = activeMatches?.find(isMatchForPlayer);

	const upcomingMatches = matches
		?.filter(isMatchForPlayer)
		.filter((m) => m.status === "pending")
		.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

	const { results: players } = useQuery(
		client,
		client
			.query("users")
			.where(
				"id",
				"in",
				registeredPlayers.map((r) => r.user_id),
			)
			.select([
				"id",
				"first_name",
				"last_name",
				"profile_image_url",
				"gender",
				"current_tournament_priority",
				"current_division",
			]),
	);

	// ... calculate role and other state
	const currentRole = currentMatch
		? currentMatch.umpire === playerId
			? "umpiring"
			: "playing"
		: "waiting";
	if (!tournamentState || !players) {
		return { loading: true, createActiveTournament: service.createTournament };
	}
	return {
		loading: false,
		createActiveTournament: undefined,
		state: {
			id: tournamentState.id,
			players: players.filter(Boolean),
			playerIds: tournamentState.players,
			currentMatch: currentMatch
				? {
						...currentMatch,
						players: [
							players?.find((p) => p.id === currentMatch?.player_1),
							players?.find((p) => p.id === currentMatch?.player_2),
						],
						umpire: players?.find((p) => p.id === currentMatch?.umpire),
						table: currentMatch?.table_number,
					}
				: null,
			nextMatch: upcomingMatches?.[0]
				? {
						id: upcomingMatches?.[0]?.id,
						players: [
							players?.find((p) => p.id === upcomingMatches?.[0]?.player_1),
							players?.find((p) => p.id === upcomingMatches?.[0]?.player_2),
						],
						umpire: players?.find((p) => p.id === upcomingMatches?.[0]?.umpire),
					}
				: null,
			currentRole,
		},
	} as const;
}
export type TournamentMatch = NonNullable<
	NonNullable<ReturnType<typeof usePlayerTournament>["state"]>["currentMatch"]
>;
