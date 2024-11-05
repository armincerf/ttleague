"use client";
import { useQuery } from "@triplit/react";
import { client } from "@/lib/triplit";
import { useTournament } from "./useTournament";

export function usePlayerTournament(playerId: string) {
	const { state: tournamentState } = useTournament();
	console.log("tournamentState", tournamentState);

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
			.select([
				"id",
				"first_name",
				"last_name",
				"profile_image_url",
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
		return { loading: true };
	}
	return {
		loading: false,
		state: {
			id: tournamentState.id,
			players: players.filter(Boolean),
			playerIds: tournamentState.players,
			currentMatch: {
				...currentMatch,
				players: [
					players?.find((p) => p.id === currentMatch?.player_1),
					players?.find((p) => p.id === currentMatch?.player_2),
				],
				umpire: players?.find((p) => p.id === currentMatch?.umpire),
				table: currentMatch?.table_number,
			},
			nextMatch: {
				id: upcomingMatches?.[0]?.id,
				players: [
					players?.find((p) => p.id === upcomingMatches?.[0]?.player_1),
					players?.find((p) => p.id === upcomingMatches?.[0]?.player_2),
				],
				umpire: players?.find((p) => p.id === upcomingMatches?.[0]?.umpire),
			},
			currentRole,
		},
	} as const;
}
export type TournamentMatch = NonNullable<
	NonNullable<ReturnType<typeof usePlayerTournament>["state"]>["currentMatch"]
>;
