"use client";

import { useQuery } from "@triplit/react";
import { Trophy } from "lucide-react";
import { client as triplitClient } from "@/lib/triplit";
import { PlayerList } from "./PlayerList";
import { MatchList } from "./MatchList";
import { Button } from "../ui/button";
import { StateVisualizer } from "./StateVisualizer";
import { Scoreboard } from "./Scoreboard";
import { RemainingMatches } from "./RemainingMatches";
import { useTournament } from "@/lib/tournamentManager/hooks/useTournament";
import { Input } from "../ui/input";
import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
function TournamentManagerInner() {
	const query = useSearchParams();
	const eventId = query.get("eventId");
	const { state: tournamentState, service } = useTournament();

	const { results: allUsersNotInTournament = [] } = useQuery(
		triplitClient,
		triplitClient
			.query("users")
			.where("id", "nin", Array.from(tournamentState?.player_ids ?? [])),
	);

	const { results: matchesAllTime = [] } = useQuery(
		triplitClient,
		triplitClient.query("matches"),
	);

	const matches = tournamentState?.matches ?? [];
	const players = tournamentState?.players ?? [];

	const [fetchTime, setFetchTime] = useState<number>(0);

	const handleTestFetch = async () => {
		const start = performance.now();
		const res = await triplitClient.fetch(
			triplitClient
				.query("active_tournaments")
				.where("id", "=", tournamentState?.id ?? "")
				.include("event")
				.include("matches")
				.include("players")
				.build(),
		);
		const end = performance.now();
		console.log(res);
		setFetchTime(end - start);
	};

	const handleStartTournament = useCallback(async () => {
		if (!tournamentState) return;
		await service.generateNextMatch({
			tournamentId: tournamentState.id,
			matchesAllTime,
			silent: false,
		});
	}, [tournamentState, service, matchesAllTime]);

	if (!tournamentState)
		return (
			<div>
				<Button
					disabled={!eventId}
					onClick={() => {
						if (!eventId) return;
						return service.createTournament(eventId);
					}}
				>
					{eventId ? "Create Tournament" : "No Event ID"}
				</Button>
			</div>
		);

	const activeMatches = matches.filter(
		(m) => m.status === "ongoing" || m.status === "pending",
	);
	console.log(
		"tournamentState",
		tournamentState?.event?.tables.size,
		activeMatches.length,
	);

	return (
		<div className="max-w-6xl mx-auto">
			<div className="bg-white rounded-lg shadow-lg p-6 mb-8">
				<h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
					<Trophy className="w-8 h-8 text-yellow-500" />
					Tournament Management System
				</h1>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => {
							if (allUsersNotInTournament.length > 0) {
								service.addPlayer(
									tournamentState.id,
									allUsersNotInTournament[0].id,
								);
							}
						}}
					>
						Add Player
					</Button>
					<Button
						variant="outline"
						onClick={() =>
							service.removePlayer(tournamentState.id, players[0].id)
						}
					>
						Remove Player
					</Button>
					<Button
						variant="destructive"
						onClick={() => {
							const tournamentId = tournamentState.id;
							const matchIds = tournamentState.matches.map((m) => m.id);
							return service.resetTournament(tournamentId, matchIds);
						}}
					>
						Reset Tournament
					</Button>
					<span>Number of Rounds</span>
					<Input
						type="number"
						value={tournamentState.total_rounds}
						className="w-16"
						onChange={(e) =>
							service.updateTournament(tournamentState.id, {
								total_rounds: Number.parseInt(e.target.value),
							})
						}
					/>
					<span>Number of Tables</span>
					<Input
						type="number"
						value={tournamentState.event?.tables.size}
						onChange={(e) =>
							service.updateEvent(tournamentState.event_id, {
								tables: new Set(
									Array.from(
										{ length: Number.parseInt(e.target.value) },
										(_, i) => i,
									),
								),
							})
						}
						className="w-16"
					/>
					<Button variant="outline" onClick={handleTestFetch}>
						Test Fetch ({fetchTime.toFixed(2)}ms)
					</Button>
				</div>

				<StateVisualizer
					state={tournamentState.status}
					context={tournamentState}
					tableCount={tournamentState.event?.tables.size ?? 1}
				/>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<PlayerList
						players={players}
						maxPlayerCount={10}
						matches={matches.filter((m) => m.status !== "ended")}
					/>
					<MatchList
						matches={matches}
						players={players}
						tables={tournamentState.event?.tables.size ?? 1}
						freeTables={
							(tournamentState.event?.tables.size ?? 1) - activeMatches.length
						}
					/>
					<Scoreboard players={players} matches={matches} />
					<RemainingMatches
						players={players}
						matches={matches}
						totalRounds={tournamentState.total_rounds}
					/>
					<Button
						onClick={handleStartTournament}
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						Start Tournament
					</Button>
				</div>
			</div>
		</div>
	);
}

const queryClient = new QueryClient();
export function TournamentManager() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<QueryClientProvider client={queryClient}>
				<TournamentManagerInner />
			</QueryClientProvider>
		</Suspense>
	);
}
