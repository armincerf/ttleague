"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { useMachine } from "@xstate/react";
import { tournamentMachine } from "@/lib/tournamentManager/machines/tournamentMachine";
import { PlayerList } from "./PlayerList";
import { MatchList } from "./MatchList";
import { StateVisualizer } from "./StateVisualizer";

export function TournamentManager() {
	const [state, send] = useMachine(tournamentMachine);
	const [updateTrigger, setUpdateTrigger] = useState(0);

	useEffect(() => {
		const initialPlayers = [
			{ id: "P1", name: "Alice" },
			{ id: "P2", name: "Bob" },
			{ id: "P3", name: "Charlie" },
			{ id: "P4", name: "Diana" },
			{ id: "P5", name: "Eve" },
		];

		initialPlayers.forEach((player, index) => {
			setTimeout(() => {
				send({ type: "player.add", ...player });
			}, index * 1000);
		});
	}, [send]);

	const handleConfirmWinner = (matchId: string, winnerId: string) => {
		setUpdateTrigger((prev) => prev + 1);
		send({ type: "match.confirmWinner", matchId, winnerId });
	};

	const handleConfirmMatch = (matchId: string, playerId: string) => {
		setUpdateTrigger((prev) => prev + 1);
		send({ type: "match.confirm", matchId, playerId });
	};

	const handleStartMatch = () => {
		setUpdateTrigger((prev) => prev + 1);
		send({ type: "tournament.start" });
	};

	return (
		<div className="max-w-6xl mx-auto">
			<div className="bg-white rounded-lg shadow-lg p-6 mb-8">
				<h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
					<Trophy className="w-8 h-8 text-yellow-500" />
					Tournament Management System
				</h1>

				<StateVisualizer currentState={state.value} context={state.context} />

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<PlayerList
						players={Array.from(state.context.players.values())}
						maxPlayerCount={state.context.maxPlayerCount}
					/>
					<MatchList
						matches={Array.from(state.context.matches.values())}
						tables={state.context.tables}
						freeTables={state.context.freeTables}
						onConfirmWinner={handleConfirmWinner}
						onConfirmMatch={handleConfirmMatch}
					/>
					<button
						type="button"
						onClick={handleStartMatch}
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						Start Match
					</button>
				</div>
			</div>
		</div>
	);
}
