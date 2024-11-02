import { setup, assign, emit } from "xstate";
import { produce, enableMapSet } from "immer";
import type { TournamentContext, Player, Match } from "../types";
import {
	createMatch,
	createPlayer,
	sortPriorityQueue,
	addPlayerToTournament,
	removePlayerFromTournament,
	updateWaitingTimes,
	findAvailableOpponent,
	findAvailableUmpire,
	updatePlayerStates,
	isMatchComplete,
	canStartNewMatch,
	confirmMatchWinner,
} from "../utils";
enableMapSet();

export const tournamentMachine = setup({
	types: {
		context: {} as TournamentContext,
		events: {} as
			| { type: "tournament.start" }
			| { type: "player.add"; id: string; name: string }
			| { type: "player.remove"; id: string }
			| { type: "match.start" }
			| { type: "match.confirmWinner"; matchId: string; winnerId: string }
			| { type: "match.confirm"; matchId: string; playerId: string }
			| { type: "time.update" },
	},
}).createMachine({
	id: "tournament",
	initial: "idle",
	context: {
		active: true,
		players: new Map<string, Player>(),
		matches: new Map<string, Match>(),
		priorityQueue: [] as Player[],
		tables: 1,
		freeTables: 1,
		maxPlayerCount: 10,
	} as TournamentContext,
	on: {
		"player.add": {
			actions: assign(({ context, event }) =>
				produce(context, (draft) => {
					draft.players = addPlayerToTournament(
						draft.players,
						event.id,
						event.name,
						draft.maxPlayerCount,
					);
					draft.priorityQueue.push(createPlayer(event.id, event.name));
				}),
			),
		},
		"player.remove": {
			guard: ({ context, event }) => {
				const player = context.players.get(event.id);
				return player?.state !== "playing" && player?.state !== "umpiring";
			},
			actions: assign(({ context, event }) =>
				produce(context, (draft) => {
					draft.players = removePlayerFromTournament(draft.players, event.id);
					const index = draft.priorityQueue.findIndex((p) => p.id === event.id);
					if (index !== -1) {
						draft.priorityQueue.splice(index, 1);
					}
					draft.active = draft.players.size < 3 ? false : draft.active;
				}),
			),
		},
	},
	states: {
		idle: {
			on: {
				"tournament.start": {
					guard: ({ context }) => context.players.size >= 3,
					target: "inProgress",
				},
			},
		},
		inProgress: {
			always: {
				guard: ({ context }) =>
					canStartNewMatch(context.freeTables, context.priorityQueue.length),
				actions: [emit({ type: "match.start" })],
			},
			on: {
				"match.start": {
					guard: ({ context }) =>
						canStartNewMatch(context.freeTables, context.priorityQueue.length),
					actions: assign(({ context }) =>
						produce(context, (draft) => {
							const player1 = draft.priorityQueue[0];
							const player2Index = findAvailableOpponent(
								draft.priorityQueue,
								player1,
							);
							if (player2Index === -1) return;

							const player2 = draft.priorityQueue[player2Index];
							const umpireIndex = findAvailableUmpire(
								draft.priorityQueue,
								player2Index,
							);
							if (umpireIndex === -1) return;

							const umpire = draft.priorityQueue[umpireIndex];
							const match = createMatch(player1, player2, umpire);

							// Remove players from queue (in reverse order)
							draft.priorityQueue.splice(umpireIndex, 1);
							draft.priorityQueue.splice(player2Index, 1);
							draft.priorityQueue.splice(0, 1);

							// Update states
							updatePlayerStates(draft.priorityQueue, [
								{ player: player1, newState: "playing" },
								{ player: player2, newState: "playing" },
								{ player: umpire, newState: "umpiring" },
							]);

							// Update match-related data
							draft.matches.set(match.id, match);
							player1.matchHistory.add(player2.id);
							player2.matchHistory.add(player1.id);
							draft.freeTables--;
						}),
					),
				},
				"match.confirmWinner": {
					actions: assign(({ context, event }) =>
						produce(context, (draft) => {
							draft.matches = confirmMatchWinner(
								draft.matches,
								event.matchId,
								event.winnerId,
							);
							return draft;
						}),
					),
				},
				"match.confirm": {
					actions: [
						assign(({ context, event }) =>
							produce(context, (draft) => {
								const match = draft.matches.get(event.matchId);

								if (!match || match.state !== "ongoing" || !match.winnerId) {
									console.debug("Match confirmation failed:", {
										matchExists: !!match,
										matchState: match?.state,
										hasWinner: !!match?.winnerId,
									});
									return context;
								}

								match.playersConfirmed ??= new Set();

								if (event.playerId === match.umpire.id) {
									match.umpireConfirmed = true;
								} else if (
									event.playerId === match.player1.id ||
									event.playerId === match.player2.id
								) {
									match.playersConfirmed.add(event.playerId);
								}

								if (isMatchComplete(match)) {
									match.state = "ended";
									match.endTime = new Date();

									// Update both priority queue and players Map
									for (const player of [
										match.player1,
										match.player2,
										match.umpire,
									]) {
										player.state = "waiting";
										draft.priorityQueue.push(player);

										// Update the player in the players Map
										const mapPlayer = draft.players.get(player.id);
										if (mapPlayer) {
											mapPlayer.state = "waiting";
											mapPlayer.totalTimeWaiting = player.totalTimeWaiting;
										}
									}

									draft.freeTables++;
								}
							}),
						),
						emit({ type: "match.start" }),
					],
				},
				"time.update": {
					actions: assign(({ context }) =>
						produce(context, (draft) => {
							// Update both priority queue and players Map
							draft.priorityQueue = updateWaitingTimes(draft.priorityQueue);

							// Update resting times for players in the Map
							for (const player of draft.priorityQueue) {
								if (player.state === "waiting") {
									const mapPlayer = draft.players.get(player.id);
									if (mapPlayer) {
										mapPlayer.totalTimeWaiting = player.totalTimeWaiting;
									}
								}
							}

							sortPriorityQueue(draft);
						}),
					),
				},
			},
		},
	},
});
