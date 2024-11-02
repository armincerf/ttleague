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

const eventId = "123";

export function TournamentManager() {
	const { state: tournamentState, service } = useTournament();

	const { results: allUsersNotInTournament = [] } = useQuery(
		triplitClient,
		triplitClient
			.query("users")
			.where("id", "nin", Array.from(tournamentState?.player_ids ?? [])),
	);

	const matches = tournamentState?.matches ?? [];
	const players = tournamentState?.players ?? [];

	const handleStartTournament = async () => {
		if (!tournamentState) return;
		await service.generateNextMatch(tournamentState.id);
	};

	if (!tournamentState)
		return (
			<div>
				<Button onClick={() => service.createTournament(eventId)}>
					Create Tournament
				</Button>
			</div>
		);

	return (
		<div className="max-w-6xl mx-auto">
			<div className="bg-white rounded-lg shadow-lg p-6 mb-8">
				<h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
					<Trophy className="w-8 h-8 text-yellow-500" />
					Tournament Management System
				</h1>
				<div className="flex items-center gap-2">
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
					<Button
						variant="outline"
						onClick={() =>
							service.addPlayer(
								tournamentState.id,
								allUsersNotInTournament[0].id,
							)
						}
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
						onClick={() => service.resetTournament(tournamentState)}
					>
						Reset Tournament
					</Button>
				</div>

				<StateVisualizer
					state={tournamentState.status}
					context={tournamentState}
					tableCount={1}
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
						tables={1}
						freeTables={matches.length === 0 ? 1 : 0}
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
