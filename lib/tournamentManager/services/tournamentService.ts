import { toast } from "@/hooks/use-toast";
import type { TriplitClient } from "@triplit/client";
import type { schema, ActiveTournament, Event } from "@/triplit/schema";
import { createMatchGenerator } from "../utils/matchUtils";
import { getWaitingPlayers } from "../utils/playerUtils";
import { createMatchConfirmation } from "../utils/matchConfirmationUtils";

const marky = require("marky");

export function createTournamentService(client: TriplitClient<typeof schema>) {
	const matchGenerator = createMatchGenerator(client);
	const matchConfirmation = createMatchConfirmation(client);

	return {
		matchConfirmation,

		async createTournament(eventId: string) {
			marky.mark("createTournament");
			const tournament = await client.insert("active_tournaments", {
				event_id: eventId,
				status: "idle",
				player_ids: new Set<string>(),
				created_at: new Date(),
				updated_at: new Date(),
				total_rounds: 1,
			});

			toast({
				title: "Tournament Created",
				description: "New tournament has been created",
			});

			marky.stop("createTournament");
			return tournament.output;
		},

		async resetTournament(tournamentId: string, matchIds: string[]) {
			marky.mark("resetTournament");
			await client.transact(async (tx) => {
				for (const matchId of matchIds) {
					await tx.delete("matches", matchId);
				}
				await tx.delete("active_tournaments", tournamentId);
			});

			toast({
				title: "Tournament Reset",
				description: "Tournament and all matches have been deleted",
			});
			marky.stop("resetTournament");
		},

		async addPlayer(tournamentId: string, playerId: string) {
			marky.mark("addPlayer");
			await client.transact(async (tx) => {
				await tx.update("active_tournaments", tournamentId, (tournament) => {
					tournament.player_ids.add(playerId);
				});
				await tx.update("users", playerId, (user) => {
					user.current_tournament_priority = 5;
				});
			});
			marky.stop("addPlayer");
		},

		async removePlayer(tournamentId: string, playerId: string) {
			marky.mark("removePlayer");
			await client.update("active_tournaments", tournamentId, (tournament) => {
				tournament.player_ids.delete(playerId);
			});
			marky.stop("removePlayer");
		},

		async updateTournament(
			tournamentId: string,
			updates: Partial<ActiveTournament>,
		) {
			marky.mark("updateTournament");
			await client.update("active_tournaments", tournamentId, (tournament) => {
				Object.assign(tournament, updates);
			});
			marky.stop("updateTournament");
		},

		async updateEvent(eventId: string, updates: Partial<Event>) {
			marky.mark("updateEvent");
			await client.update("events", eventId, (event) => {
				Object.assign(event, updates);
			});
			marky.stop("updateEvent");
		},

		async generateNextMatch({
			tournamentId,
			silent = true,
		}: {
			tournamentId: string;
			silent?: boolean;
		}) {
			marky.mark("generateNextMatch");
			const tournament = await client.fetchOne(
				client
					.query("active_tournaments")
					.where("id", "=", tournamentId)
					.include("players")
					.include("matches")
					.include("event")
					.build(),
				{ policy: "remote-first" },
			);
			if (!tournament) {
				console.error(`Tournament not found: ${tournamentId}`);
				return;
			}
			console.log("tournament", tournament);
			const matches = tournament.matches;
			const players = tournament.players;
			const event = tournament.event;
			const activeMatches = matches.filter(
				(m) => m.status === "ongoing" || m.status === "pending",
			);
			const freeTables = (event?.tables.size ?? 1) - activeMatches.length;

			const waitingPlayers = getWaitingPlayers(players, matches);
			const result = await matchGenerator(
				tournament.id,
				waitingPlayers,
				matches,
				tournament.event_id,
				tournament.total_rounds ?? 1,
				freeTables,
			);

			if (!result.success && !silent) {
				toast({
					title: "Error",
					description: result.error,
					variant: "destructive",
				});
			}

			marky.stop("generateNextMatch");
			return result;
		},
	};
}

export type TournamentService = ReturnType<typeof createTournamentService>;
