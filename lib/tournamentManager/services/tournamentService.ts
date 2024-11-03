import { toast } from "@/hooks/use-toast";
import type { TriplitClient } from "@triplit/client";
import type { schema, Match, User, ActiveTournament } from "@/triplit/schema";
import { createMatchGenerator } from "../utils/matchUtils";
import { getWaitingPlayers } from "../utils/playerUtils";
import { createMatchConfirmation } from "../utils/matchConfirmationUtils";

export function createTournamentService(client: TriplitClient<typeof schema>) {
	const matchGenerator = createMatchGenerator(client);
	const matchConfirmation = createMatchConfirmation(client);

	return {
		matchConfirmation,

		async createTournament(eventId: string) {
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

			return tournament.output;
		},

		async resetTournament(tournamentId: string, matchIds: string[]) {
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
		},

		async addPlayer(tournamentId: string, playerId: string) {
			await client.update("active_tournaments", tournamentId, (tournament) => {
				tournament.player_ids.add(playerId);
			});
		},

		async removePlayer(tournamentId: string, playerId: string) {
			await client.update("active_tournaments", tournamentId, (tournament) => {
				tournament.player_ids.delete(playerId);
			});
		},

		async updateTournament(
			tournamentId: string,
			updates: Partial<ActiveTournament>,
		) {
			await client.update("active_tournaments", tournamentId, (tournament) => {
				Object.assign(tournament, updates);
			});
		},

		async generateNextMatch(tournamentId: string) {
			const tournament = await client.fetchOne(
				client
					.query("active_tournaments")
					.where("id", "=", tournamentId)
					.include("players")
					.include("matches")
					.build(),
				{ policy: "remote-only" },
			);
			if (!tournament) {
				console.error(`Tournament not found: ${tournamentId}`);
				return;
			}
			console.log("tournament", tournament);
			// TODO shouldn't be needed, think triplit sets are a bit bugged
			const playerIds = Object.keys(tournament.player_ids);
			const players = await client.fetch(
				client.query("users").where("id", "in", playerIds).build(),
				{ policy: "remote-only" },
			);
			const matches = await client.fetch(
				client
					.query("matches")
					.where("event_id", "=", tournament.event_id)
					.build(),
				{ policy: "remote-only" },
			);

			const waitingPlayers = getWaitingPlayers(players, matches);
			const result = await matchGenerator(
				tournament.id,
				waitingPlayers,
				matches,
				tournament.event_id,
				tournament.total_rounds ?? 1,
			);

			if (!result.success) {
				toast({
					title: "Error",
					description: result.error,
					variant: "destructive",
				});
			}

			return result;
		},
	};
}

export type TournamentService = ReturnType<typeof createTournamentService>;
