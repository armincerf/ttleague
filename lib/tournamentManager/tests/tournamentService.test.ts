import { describe, it, expect, beforeEach } from "vitest";
import { createTournamentService } from "../services/tournamentService";
import {
	createTestClient,
	setupTournamentTest,
	createMockMatch,
} from "./triplitTestUtils";

describe("TournamentService", () => {
	const client = createTestClient();
	const tournamentService = createTournamentService(client);

	beforeEach(() => {
		client.clear();
	});

	describe("createTournament", () => {
		it("should create a new tournament", async () => {
			const { eventId } = await setupTournamentTest(client);
			const tournament = await tournamentService.createTournament(eventId);

			expect(tournament).toBeDefined();
			expect(tournament?.event_id).toBe(eventId);
			expect(tournament?.status).toBe("idle");
			expect(tournament?.player_ids.size).toBe(0);
		});
	});

	describe("player management", () => {
		it("should add and remove players", async () => {
			const { tournament, player1 } = await setupTournamentTest(client);

			await tournamentService.addPlayer(tournament.id, player1.id);
			const updatedTournament = await client.fetchById(
				"active_tournaments",
				tournament.id,
			);
			expect(updatedTournament?.player_ids.has(player1.id)).toBe(true);

			await tournamentService.removePlayer(tournament.id, player1.id);
			const finalTournament = await client.fetchById(
				"active_tournaments",
				tournament.id,
			);
			expect(finalTournament?.player_ids.has(player1.id)).toBe(false);
		});
	});

	describe("generateNextMatch", () => {
		it("should generate a match for waiting players", async () => {
			const { tournament, player1, player2 } =
				await setupTournamentTest(client);

			const result = await tournamentService.generateNextMatch({
				tournamentId: tournament.id,
				matchesAllTime: [],
				silent: false,
			});

			expect(result?.success).toBe(true);
			if (result?.success) {
				const match = result.match;
				expect(match?.player_1).toBe(player1.id);
				expect(match?.player_2).toBe(player2.id);
				expect(match?.event_id).toBe(tournament.event_id);
			}
		});

		it("should not generate a match if players are already in active matches", async () => {
			const { tournament, player1, player2 } =
				await setupTournamentTest(client);

			await createMockMatch(client, {
				player_1: player1.id,
				player_2: player2.id,
				event_id: tournament.event_id,
				status: "ongoing",
			});

			const result = await tournamentService.generateNextMatch(tournament.id);
			expect(result?.success).toBe(false);
		});
	});

	describe("resetTournament", () => {
		it("should delete tournament and all associated matches", async () => {
			const { tournament } = await setupTournamentTest(client);

			await createMockMatch(client, {
				id: "test-match",
				event_id: tournament.event_id,
			});

			await tournamentService.resetTournament(tournament.id, ["test-match"]);

			const deletedTournament = await client.fetchById(
				"active_tournaments",
				tournament.id,
			);
			const matches = await client.fetch(
				client
					.query("matches")
					.where("event_id", "=", tournament.event_id)
					.build(),
			);

			expect(deletedTournament).toBeNull();
			expect(matches.length).toBe(0);
		});
	});
});
