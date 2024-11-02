import type { TournamentContext, Match, Player } from "./types";
import { produce } from "immer";
import * as R from "remeda";

export function sortPriorityQueue(context: TournamentContext) {
	console.log("Sorting priority queue...");
	context.priorityQueue = R.sort(context.priorityQueue, (a, b) => {
		const aGamesPlayed = getPlayerGamesPlayed(a.id, context.matches);
		const bGamesPlayed = getPlayerGamesPlayed(b.id, context.matches);

		if (aGamesPlayed !== bGamesPlayed) {
			return aGamesPlayed - bGamesPlayed;
		}

		return b.totalTimeWaiting - a.totalTimeWaiting;
	});
	console.log(
		"Priority queue sorted:",
		context?.priorityQueue?.map((p) => p.name),
	);
}

function getPlayerGamesPlayed(playerId: string, matches: Map<string, Match>) {
	return Array.from(matches.values()).filter(
		(m) =>
			(m.player1.id === playerId || m.player2.id === playerId) &&
			m.state === "ended",
	).length;
}

export function generateMatchId() {
	return `match_${Date.now()}_${Math.random()}`;
}

export function createPlayer(id: string, name: string): Player {
	return {
		id,
		name,
		state: "waiting",
		lastState: "playing",
		totalTimeWaiting: 0,
		matchHistory: new Set(),
	};
}

export function createMatch(
	player1: Player,
	player2: Player,
	umpire: Player,
): Match {
	return {
		id: generateMatchId(),
		player1,
		player2,
		umpire,
		state: "ongoing",
		startTime: new Date(),
		playersConfirmed: new Set(),
		umpireConfirmed: false,
	};
}

export function addPlayerToTournament(
	players: Map<string, Player>,
	id: string,
	name: string,
	maxPlayerCount: number,
) {
	if (players.has(id)) {
		console.log(`Player ${name} is already in the tournament.`);
		return players;
	}

	if (players.size >= maxPlayerCount) {
		console.log(`Cannot add player ${name}: maximum player count reached.`);
		return players;
	}

	return produce(players, (draft) => {
		draft.set(id, createPlayer(id, name));
	});
}

export function removePlayerFromTournament(
	players: Map<string, Player>,
	playerId: string,
) {
	return produce(players, (draft) => {
		const player = draft.get(playerId);
		if (!player) {
			console.log(`Player ${playerId} does not exist.`);
			return;
		}

		if (player.state !== "waiting") {
			console.log(
				`Player ${player.name} cannot leave while in state ${player.state}.`,
			);
			return;
		}

		draft.delete(playerId);
	});
}

export function confirmMatchWinner(
	matches: Map<string, Match>,
	matchId: string,
	winnerId: string,
) {
	return produce(matches, (draft) => {
		const match = draft.get(matchId);
		if (!match || match.state !== "ongoing" || match.winnerId) return;

		match.winnerId = winnerId;
		console.log(`Winner confirmed for match ${matchId}: ${winnerId}`);
	});
}

export function updateWaitingTimes(priorityQueue: Player[]) {
	return produce(priorityQueue, (draft) => {
		console.log("Updating time for all waiting players...");
		for (const player of draft) {
			if (player.state === "waiting") {
				player.totalTimeWaiting += 1;
			}
		}
	});
}

export function findAvailableOpponent(
	players: Player[],
	currentPlayer: Player,
): number {
	const currentIndex = players.findIndex((p) => p.id === currentPlayer.id);
	if (currentIndex === -1) return -1;

	// Search after current player
	for (let i = currentIndex + 1; i < players.length; i++) {
		if (!currentPlayer.matchHistory.has(players[i].id)) {
			return i;
		}
	}

	// Search before current player
	for (let i = 0; i < currentIndex; i++) {
		if (!currentPlayer.matchHistory.has(players[i].id)) {
			return i;
		}
	}

	return -1;
}

export function findAvailableUmpire(
	players: Player[],
	excludeIndex: number,
	startIndex = 1,
): number {
	for (let i = startIndex; i < players.length; i++) {
		if (i !== excludeIndex) {
			return i;
		}
	}
	return -1;
}

export function updatePlayerStates(
	players: Player[],
	states: Array<{ player: Player; newState: Player["state"] }>,
) {
	return produce(players, (draft) => {
		for (const { player, newState } of states) {
			const targetPlayer = draft.find((p) => p.id === player.id);
			if (targetPlayer) {
				targetPlayer.lastState = targetPlayer.state;
				targetPlayer.state = newState;
			}
		}
	});
}

export function isMatchComplete(match: Match): boolean {
	return (
		match.umpireConfirmed &&
		match.playersConfirmed.size === 2 &&
		match.state === "ongoing" &&
		Boolean(match.winnerId)
	);
}

export function canStartNewMatch(
	freeTables: number,
	queueLength: number,
): boolean {
	return freeTables > 0 && queueLength >= 3;
}
